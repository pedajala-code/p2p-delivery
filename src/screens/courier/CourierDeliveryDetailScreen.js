import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, FONTS, DELIVERY_STATUS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';

export default function CourierDeliveryDetailScreen({ route, navigation }) {
  const { deliveryId } = route.params;
  const { user } = useAuth();
  const [delivery, setDelivery] = useState(null);
  const [sender, setSender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDelivery = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          sender:users!sender_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', deliveryId)
        .single();

      if (error) throw error;

      setDelivery(data);
      setSender(data.sender || null);
    } catch (err) {
      console.error('Error fetching delivery:', err.message);
      Alert.alert('Error', 'Failed to load delivery details.');
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  useEffect(() => {
    const subscription = supabase
      .channel(`delivery-detail-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          setDelivery((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [deliveryId]);

  const handleAcceptDelivery = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          courier_id: user.id,
          status: 'accepted',
        })
        .eq('id', deliveryId)
        .is('courier_id', null);

      if (error) throw error;

      Alert.alert('Success', 'Delivery accepted! Contact the sender to coordinate pickup.');
      fetchDelivery();
    } catch (err) {
      console.error('Error accepting delivery:', err.message);
      Alert.alert('Error', 'Failed to accept delivery. It may have already been taken.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus })
        .eq('id', deliveryId)
        .eq('courier_id', user.id);

      if (error) throw error;
      fetchDelivery();
    } catch (err) {
      console.error('Error updating status:', err.message);
      Alert.alert('Error', 'Failed to update delivery status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to take a proof of delivery photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });

      if (result.canceled) return;

      setActionLoading(true);

      const photo = result.assets[0];
      const fileExt = 'jpg';
      const filePath = `delivery-proofs/${deliveryId}.${fileExt}`;

      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('delivery-proofs')
        .getPublicUrl(filePath);

      const proofUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          status: 'delivered',
          proof_photo_url: proofUrl,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .eq('courier_id', user.id);

      if (updateError) throw updateError;

      Alert.alert('Delivery Complete', 'Proof photo uploaded. Great job!');
      fetchDelivery();
    } catch (err) {
      console.error('Error completing delivery:', err.message);
      Alert.alert('Error', 'Failed to complete delivery. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButton = () => {
    if (!delivery) return null;

    const isPending = delivery.status === 'pending' && !delivery.courier_id;
    const isMyCourier = delivery.courier_id === user?.id;

    if (isPending) {
      return (
        <Button
          title="Accept Delivery"
          onPress={handleAcceptDelivery}
          loading={actionLoading}
          style={styles.actionButton}
        />
      );
    }

    if (!isMyCourier) return null;

    switch (delivery.status) {
      case 'accepted':
        return (
          <Button
            title="Mark as Picked Up"
            onPress={() => handleUpdateStatus('picked_up')}
            loading={actionLoading}
            style={styles.actionButton}
          />
        );
      case 'picked_up':
        return (
          <Button
            title="Start Transit"
            onPress={() => handleUpdateStatus('in_transit')}
            loading={actionLoading}
            style={styles.actionButton}
          />
        );
      case 'in_transit':
        return (
          <Button
            title="Complete Delivery"
            onPress={handleCompleteDelivery}
            loading={actionLoading}
            style={[styles.actionButton, styles.completeButton]}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Delivery not found.</Text>
      </View>
    );
  }

  const offeredPrice = parseFloat(delivery.offered_price || 0);
  const courierPayout = offeredPrice * 0.75;
  const isMyCourier = delivery.courier_id === user?.id;
  const showSenderInfo = isMyCourier && delivery.status !== 'pending';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <StatusBadge status={delivery.status} />
          {delivery.delivered_at && (
            <Text style={styles.deliveredAt}>
              Delivered {new Date(delivery.delivered_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceItemLabel}>Offered Price</Text>
              <Text style={styles.priceItemValue}>
                ${offeredPrice.toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceItemLabel}>Your Payout</Text>
              <Text style={[styles.priceItemValue, styles.payoutValue]}>
                ${courierPayout.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: COLORS.success || '#22C55E' }]} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Pickup</Text>
                <Text style={styles.addressText}>
                  {delivery.pickup_address}
                </Text>
              </View>
            </View>
            <View style={styles.addressConnector} />
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: COLORS.error || '#EF4444' }]} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Dropoff</Text>
                <Text style={styles.addressText}>
                  {delivery.dropoff_address}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={20} color={COLORS.gray} />
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>
                {delivery.package_size || 'Not specified'}
              </Text>
            </View>
            {delivery.package_description && (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.gray} />
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>
                  {delivery.package_description}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sender Info (only when delivery is accepted by this courier) */}
        {showSenderInfo && sender && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sender Contact</Text>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color={COLORS.gray} />
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>
                  {sender.full_name || 'N/A'}
                </Text>
              </View>
              {sender.email && (
                <View style={styles.detailRow}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{sender.email}</Text>
                </View>
              )}
              {sender.phone && (
                <View style={styles.detailRow}>
                  <Ionicons name="call-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{sender.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Proof Photo (if delivered) */}
        {delivery.proof_photo_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proof of Delivery</Text>
            <Image
              source={{ uri: delivery.proof_photo_url }}
              style={styles.proofPhoto}
              resizeMode="cover"
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      {renderActionButton() && (
        <View style={styles.bottomBar}>{renderActionButton()}</View>
      )}
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
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding || 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  deliveredAt: {
    fontSize: 13,
    color: COLORS.gray,
  },
  priceCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceItemLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  priceItemValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark || '#333',
  },
  payoutValue: {
    color: COLORS.success || '#22C55E',
  },
  priceDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.lightGray || '#E5E5E5',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark || '#333',
    marginBottom: 10,
  },
  addressCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    color: COLORS.dark || '#333',
    lineHeight: 20,
  },
  addressConnector: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.lightGray || '#E5E5E5',
    marginLeft: 5.5,
    marginVertical: 4,
  },
  detailCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray || '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 10,
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark || '#333',
    flex: 1,
    textAlign: 'right',
  },
  proofPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray || '#E5E5E5',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white || '#FFFFFF',
    paddingHorizontal: SIZES.padding || 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray || '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  actionButton: {
    width: '100%',
  },
  completeButton: {
    backgroundColor: COLORS.success || '#22C55E',
  },
});
