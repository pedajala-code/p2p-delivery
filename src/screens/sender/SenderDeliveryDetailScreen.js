import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SIZES,
  FONTS,
  DELIVERY_STATUS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  COMMISSION_RATE,
} from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';

// Ordered list of statuses for the timeline stepper
const STATUS_TIMELINE = [
  DELIVERY_STATUS.PENDING,
  DELIVERY_STATUS.ACCEPTED,
  DELIVERY_STATUS.PICKED_UP,
  DELIVERY_STATUS.IN_TRANSIT,
  DELIVERY_STATUS.DELIVERED,
];

const SenderDeliveryDetailScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params;
  const { user } = useAuth();

  const [delivery, setDelivery] = useState(null);
  const [courier, setCourier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchDeliveryDetail();
    const channel = subscribeToChanges();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  async function fetchDeliveryDetail() {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*, courier:users!deliveries_courier_id_fkey(*)')
        .eq('id', deliveryId)
        .single();

      if (error) throw error;

      setDelivery(data);
      if (data.courier) {
        setCourier(data.courier);
      }
    } catch (error) {
      console.error('Error fetching delivery:', error.message);
      Alert.alert('Error', 'Failed to load delivery details.');
    } finally {
      setLoading(false);
    }
  }

  function subscribeToChanges() {
    const channel = supabase
      .channel(`delivery-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          setDelivery((prev) => ({ ...prev, ...payload.new }));
          // If courier was just assigned, fetch courier info
          if (payload.new.courier_id && !courier) {
            fetchCourierInfo(payload.new.courier_id);
          }
        }
      )
      .subscribe();

    return channel;
  }

  async function fetchCourierInfo(courierId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', courierId)
        .single();

      if (!error && data) {
        setCourier(data);
      }
    } catch (err) {
      console.error('Error fetching courier:', err.message);
    }
  }

  async function handleCancelDelivery() {
    Alert.alert(
      'Cancel Delivery',
      'Are you sure you want to cancel this delivery?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const { error } = await supabase
                .from('deliveries')
                .update({ status: DELIVERY_STATUS.CANCELLED })
                .eq('id', deliveryId);

              if (error) throw error;

              setDelivery((prev) => ({
                ...prev,
                status: DELIVERY_STATUS.CANCELLED,
              }));
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel delivery.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }

  function handleCallCourier() {
    if (courier?.phone) {
      Linking.openURL(`tel:${courier.phone}`);
    }
  }

  function getStatusStepIndex(status) {
    // If cancelled or disputed, return -1 (special case)
    if (
      status === DELIVERY_STATUS.CANCELLED ||
      status === DELIVERY_STATUS.DISPUTED
    ) {
      return -1;
    }
    return STATUS_TIMELINE.indexOf(status);
  }

  function renderTimeline() {
    if (!delivery) return null;

    const currentIndex = getStatusStepIndex(delivery.status);
    const isCancelledOrDisputed = currentIndex === -1;

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Delivery Progress</Text>

        {isCancelledOrDisputed ? (
          <View style={styles.cancelledBanner}>
            <Ionicons
              name="close-circle"
              size={24}
              color={COLORS.danger}
            />
            <Text style={styles.cancelledText}>
              {DELIVERY_STATUS_LABELS[delivery.status]}
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {STATUS_TIMELINE.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const isLast = index === STATUS_TIMELINE.length - 1;
              const dotColor = isCompleted
                ? COLORS.primary
                : COLORS.disabled;

              return (
                <View key={status} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: dotColor },
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      {isCompleted && (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor: index < currentIndex
                              ? COLORS.primary
                              : COLORS.disabled,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        isCompleted && styles.timelineLabelActive,
                        isCurrent && styles.timelineLabelCurrent,
                      ]}
                    >
                      {DELIVERY_STATUS_LABELS[status]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  function renderCourierInfo() {
    if (!courier) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Courier</Text>
        <View style={styles.courierCard}>
          <View style={styles.courierAvatar}>
            <Ionicons name="person" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.courierDetails}>
            <Text style={styles.courierName}>
              {courier.full_name || courier.email || 'Courier'}
            </Text>
            {courier.phone ? (
              <TouchableOpacity onPress={handleCallCourier}>
                <Text style={styles.courierPhone}>{courier.phone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {courier.phone ? (
            <TouchableOpacity
              onPress={handleCallCourier}
              style={styles.callButton}
            >
              <Ionicons name="call" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  function renderPriceBreakdown() {
    if (!delivery) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Offered Price</Text>
            <Text style={styles.priceValue}>
              ${parseFloat(delivery.offered_price).toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Platform Fee ({(COMMISSION_RATE * 100).toFixed(0)}%)
            </Text>
            <Text style={[styles.priceValue, { color: COLORS.danger }]}>
              -${parseFloat(delivery.platform_fee).toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabelBold}>Courier Receives</Text>
            <Text style={[styles.priceValueBold, { color: COLORS.secondary }]}>
              ${parseFloat(delivery.courier_payout).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderProofPhoto() {
    if (
      delivery?.status !== DELIVERY_STATUS.DELIVERED ||
      !delivery?.proof_photo_url
    ) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Proof</Text>
        <Image
          source={{ uri: delivery.proof_photo_url }}
          style={styles.proofImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  function renderActions() {
    if (!delivery) return null;

    const actions = [];

    // Pending: allow cancellation
    if (delivery.status === DELIVERY_STATUS.PENDING) {
      actions.push(
        <Button
          key="cancel"
          title="Cancel Delivery"
          onPress={handleCancelDelivery}
          variant="danger"
          loading={cancelling}
          disabled={cancelling}
          style={styles.actionButton}
        />
      );
    }

    // In transit or picked up: show tracking button
    if (
      delivery.status === DELIVERY_STATUS.IN_TRANSIT ||
      delivery.status === DELIVERY_STATUS.PICKED_UP
    ) {
      actions.push(
        <Button
          key="track"
          title="Track Courier"
          onPress={() =>
            navigation.navigate('Tracking', { deliveryId: delivery.id })
          }
          style={styles.actionButton}
        />
      );
    }

    // Delivered: show rate button
    if (delivery.status === DELIVERY_STATUS.DELIVERED) {
      actions.push(
        <Button
          key="rate"
          title="Rate Courier"
          onPress={() =>
            navigation.navigate('RateDelivery', {
              deliveryId: delivery.id,
              courierId: delivery.courier_id,
            })
          }
          variant="secondary"
          style={styles.actionButton}
        />
      );
    }

    if (actions.length === 0) return null;

    return <View style={styles.actionsContainer}>{actions}</View>;
  }

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
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.disabled} />
        <Text style={styles.errorText}>Delivery not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Status */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.deliveryId}>
            #{delivery.id.slice(0, 8).toUpperCase()}
          </Text>
          <StatusBadge status={delivery.status} />
        </View>
        {delivery.created_at && (
          <Text style={styles.dateText}>
            Created {new Date(delivery.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>

      {/* Addresses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route</Text>
        <View style={styles.addressCard}>
          <View style={styles.addressRow}>
            <View style={styles.addressIconContainer}>
              <Ionicons name="radio-button-on" size={16} color={COLORS.secondary} />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Pickup</Text>
              <Text style={styles.addressText}>{delivery.pickup_address}</Text>
            </View>
          </View>

          <View style={styles.addressDividerLine} />

          <View style={styles.addressRow}>
            <View style={styles.addressIconContainer}>
              <Ionicons name="location" size={16} color={COLORS.danger} />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Dropoff</Text>
              <Text style={styles.addressText}>{delivery.dropoff_address}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Package Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Package</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={20} color={COLORS.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={styles.infoValue}>{delivery.package_size}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{delivery.package_description}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Status Timeline */}
      {renderTimeline()}

      {/* Courier Info */}
      {renderCourierInfo()}

      {/* Price Breakdown */}
      {renderPriceBreakdown()}

      {/* Proof Photo */}
      {renderProofPhoto()}

      {/* Action Buttons */}
      {renderActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl + SIZES.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },

  // Header
  header: {
    marginBottom: SIZES.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  deliveryId: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  dateText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },

  // Sections
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },

  // Address Card
  addressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIconContainer: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  addressText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  addressDividerLine: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 13,
    marginVertical: SIZES.xs,
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...FONTS.body,
    color: COLORS.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.sm,
  },

  // Timeline
  timelineContainer: {
    marginBottom: SIZES.lg,
  },
  timeline: {
    paddingLeft: SIZES.xs,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 48,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotCurrent: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: SIZES.sm,
    paddingBottom: SIZES.md,
    justifyContent: 'center',
  },
  timelineLabel: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  timelineLabelActive: {
    color: COLORS.textSecondary,
  },
  timelineLabelCurrent: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '1A',
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    gap: SIZES.sm,
  },
  cancelledText: {
    ...FONTS.bodyBold,
    color: COLORS.danger,
  },

  // Courier Card
  courierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  courierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  courierDetails: {
    flex: 1,
  },
  courierName: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  courierPhone: {
    ...FONTS.caption,
    color: COLORS.primary,
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Price Breakdown
  priceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
  },
  priceLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  priceValue: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceLabelBold: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  priceValueBold: {
    ...FONTS.bodyBold,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.sm,
  },

  // Proof Photo
  proofImage: {
    width: '100%',
    height: 250,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.border,
  },

  // Actions
  actionsContainer: {
    marginTop: SIZES.sm,
    gap: SIZES.sm,
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default SenderDeliveryDetailScreen;
