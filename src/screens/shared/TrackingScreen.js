import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { COLORS, SIZES, FONTS, DELIVERY_STATUS_COLORS, DELIVERY_STATUS_LABELS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TrackingScreen({ navigation, route }) {
  const { deliveryId } = route.params;
  const { user } = useAuth();

  const [delivery, setDelivery] = useState(null);
  const [courierLocation, setCourierLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDelivery = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (fetchError) throw fetchError;
      setDelivery(data);

      if (data.courier_id) {
        fetchCourierLocation(data.courier_id);
      }
    } catch (err) {
      console.error('Error fetching delivery:', err.message);
      setError('Failed to load delivery details.');
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  const fetchCourierLocation = async (courierId) => {
    try {
      const { data, error: locError } = await supabase
        .from('courier_locations')
        .select('*')
        .eq('courier_id', courierId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (locError && locError.code !== 'PGRST116') throw locError;
      if (data) {
        setCourierLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (err) {
      console.error('Error fetching courier location:', err.message);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  useEffect(() => {
    if (!delivery?.courier_id) return;

    const subscription = supabase
      .channel(`courier-location-${delivery.courier_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courier_locations',
          filter: `courier_id=eq.${delivery.courier_id}`,
        },
        (payload) => {
          if (payload.new) {
            setCourierLocation({
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [delivery?.courier_id]);

  const getMapRegion = () => {
    if (!delivery) return null;

    const points = [
      { latitude: delivery.pickup_latitude, longitude: delivery.pickup_longitude },
      { latitude: delivery.dropoff_latitude, longitude: delivery.dropoff_longitude },
    ];

    if (courierLocation) {
      points.push(courierLocation);
    }

    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max((maxLat - minLat) * 1.4, 0.01);
    const deltaLng = Math.max((maxLng - minLng) * 1.4, 0.01);

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !delivery) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Delivery not found.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = DELIVERY_STATUS_COLORS[delivery.status] || COLORS.textSecondary;
  const statusLabel = DELIVERY_STATUS_LABELS[delivery.status] || delivery.status;
  const region = getMapRegion();

  return (
    <View style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.bannerBackButton}>
          <Text style={styles.bannerBackText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.statusText}>{statusLabel}</Text>
        <View style={styles.bannerSpacer} />
      </View>

      {/* Map */}
      {region ? (
        <MapView style={styles.map} initialRegion={region}>
          {/* Pickup Marker */}
          <Marker
            coordinate={{
              latitude: delivery.pickup_latitude,
              longitude: delivery.pickup_longitude,
            }}
            title="Pickup"
            description={delivery.pickup_address || 'Pickup location'}
            pinColor={COLORS.secondary}
          />

          {/* Dropoff Marker */}
          <Marker
            coordinate={{
              latitude: delivery.dropoff_latitude,
              longitude: delivery.dropoff_longitude,
            }}
            title="Drop-off"
            description={delivery.dropoff_address || 'Drop-off location'}
            pinColor={COLORS.danger}
          />

          {/* Courier Location Marker */}
          {courierLocation && (
            <Marker
              coordinate={courierLocation}
              title="Courier"
              description="Current courier position"
              pinColor={COLORS.primary}
            />
          )}

          {/* Route line from pickup to dropoff */}
          <Polyline
            coordinates={[
              {
                latitude: delivery.pickup_latitude,
                longitude: delivery.pickup_longitude,
              },
              {
                latitude: delivery.dropoff_latitude,
                longitude: delivery.dropoff_longitude,
              },
            ]}
            strokeColor={COLORS.primary}
            strokeWidth={3}
            lineDashPattern={[6, 3]}
          />
        </MapView>
      ) : (
        <View style={styles.noMapContainer}>
          <Text style={styles.noMapText}>Unable to display map.</Text>
        </View>
      )}

      {/* Courier Location Info */}
      {!courierLocation && delivery.courier_id && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingText}>Waiting for courier location...</Text>
        </View>
      )}

      {!delivery.courier_id && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingText}>No courier assigned yet.</Text>
        </View>
      )}

      {/* Delivery Info Footer */}
      <View style={styles.infoFooter}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Pickup</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {delivery.pickup_address || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Drop-off</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {delivery.dropoff_address || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.lg,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  backButton: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  backButtonText: {
    ...FONTS.bodyBold,
    color: '#FFFFFF',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.xxl,
    paddingBottom: SIZES.md,
  },
  bannerBackButton: {
    paddingVertical: SIZES.xs,
    paddingRight: SIZES.sm,
  },
  bannerBackText: {
    ...FONTS.bodyBold,
    color: '#FFFFFF',
  },
  statusText: {
    ...FONTS.h3,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bannerSpacer: {
    width: 60,
  },
  map: {
    flex: 1,
  },
  noMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  waitingBanner: {
    backgroundColor: COLORS.warning,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
  },
  waitingText: {
    ...FONTS.caption,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoFooter: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    marginHorizontal: SIZES.xs,
  },
  infoLabel: {
    ...FONTS.small,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  infoValue: {
    ...FONTS.caption,
    color: COLORS.text,
  },
});
