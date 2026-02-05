import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import DeliveryCard from '../../components/DeliveryCard';

export default function AvailableDeliveriesScreen({ navigation }) {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
    }
  }, [user]);

  const fetchAvailableDeliveries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('status', 'pending')
        .is('courier_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (err) {
      console.error('Error fetching available deliveries:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAvailableDeliveries();
  }, [fetchProfile, fetchAvailableDeliveries]);

  useEffect(() => {
    const subscription = supabase
      .channel('available-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: 'status=eq.pending',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && !payload.new.courier_id) {
            setDeliveries((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.courier_id || payload.new.status !== 'pending') {
              setDeliveries((prev) =>
                prev.filter((d) => d.id !== payload.new.id)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setDeliveries((prev) =>
              prev.filter((d) => d.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAvailableDeliveries();
  }, [fetchAvailableDeliveries]);

  const handleDeliveryPress = (item) => {
    navigation.navigate('CourierDeliveryDetail', { deliveryId: item.id });
  };

  const renderVerificationBanner = () => {
    if (profile?.courier_verified === true) return null;

    return (
      <View style={styles.verificationBanner}>
        <View style={styles.verificationContent}>
          <Ionicons
            name="warning-outline"
            size={22}
            color={COLORS.white}
          />
          <Text style={styles.verificationText}>
            Complete verification to start delivering
          </Text>
        </View>
        <TouchableOpacity
          style={styles.verificationButton}
          onPress={() => navigation.navigate('CourierVerification')}
        >
          <Text style={styles.verificationButtonText}>Verify Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDeliveryItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleDeliveryPress(item)}
    >
      <DeliveryCard delivery={item} />
      <View style={styles.priceOverlay}>
        <Text style={styles.priceLabel}>Offered</Text>
        <Text style={styles.priceAmount}>
          ${parseFloat(item.offered_price || 0).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="bicycle-outline"
        size={64}
        color={COLORS.gray}
      />
      <Text style={styles.emptyTitle}>No deliveries available nearby</Text>
      <Text style={styles.emptySubtitle}>
        Pull down to refresh or check back later
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderVerificationBanner()}
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderDeliveryItem}
        contentContainerStyle={
          deliveries.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background || '#F5F5F5',
  },
  verificationBanner: {
    backgroundColor: COLORS.warning || '#F59E0B',
    paddingHorizontal: SIZES.padding || 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  verificationText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flexShrink: 1,
  },
  verificationButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  verificationButtonText: {
    color: COLORS.warning || '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SIZES.padding || 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding || 16,
  },
  priceOverlay: {
    position: 'absolute',
    top: 12,
    right: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  priceLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceAmount: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark || '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});
