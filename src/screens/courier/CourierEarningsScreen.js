import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function CourierEarningsScreen({ navigation }) {
  const { user } = useAuth();
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [deliveriesResult, profileResult] = await Promise.all([
        supabase
          .from('deliveries')
          .select('*')
          .eq('courier_id', user.id)
          .eq('status', 'delivered')
          .order('delivered_at', { ascending: false }),
        supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single(),
      ]);

      if (deliveriesResult.error) throw deliveriesResult.error;
      if (profileResult.error) throw profileResult.error;

      setCompletedDeliveries(deliveriesResult.data || []);
      setProfile(profileResult.data);
    } catch (err) {
      console.error('Error fetching earnings data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const calculateEarnings = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarned = 0;
    let thisMonth = 0;
    let thisWeek = 0;

    completedDeliveries.forEach((delivery) => {
      const payout = parseFloat(delivery.courier_payout || 0);
      totalEarned += payout;

      const deliveredDate = delivery.delivered_at
        ? new Date(delivery.delivered_at)
        : null;

      if (deliveredDate) {
        if (deliveredDate >= startOfMonth) {
          thisMonth += payout;
        }
        if (deliveredDate >= startOfWeek) {
          thisWeek += payout;
        }
      }
    });

    return { totalEarned, thisMonth, thisWeek };
  };

  const handleSetupPayouts = () => {
    Alert.alert(
      'Stripe Connect',
      'Payout setup will be available soon. You will be able to link your bank account to receive direct deposits.',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateAddress = (address) => {
    if (!address) return '...';
    const parts = address.split(',');
    return parts[0].trim();
  };

  const { totalEarned, thisMonth, thisWeek } = calculateEarnings();
  const hasStripeAccount = !!profile?.stripe_account_id;

  const renderEarningsSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Earnings Summary</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Earned</Text>
          <Text style={styles.summaryValue}>
            ${totalEarned.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryValue}>
            ${thisMonth.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>This Week</Text>
          <Text style={styles.summaryValue}>
            ${thisWeek.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStripeStatus = () => (
    <View style={styles.stripeCard}>
      <View style={styles.stripeHeader}>
        <Ionicons name="card-outline" size={22} color={COLORS.dark || '#333'} />
        <Text style={styles.stripeTitle}>Payout Status</Text>
      </View>
      {hasStripeAccount ? (
        <View style={styles.stripeActive}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={COLORS.success || '#22C55E'}
          />
          <Text style={styles.stripeActiveText}>Payouts Active</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.stripeSetupButton}
          onPress={handleSetupPayouts}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.stripeSetupText}>Set Up Payouts</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEarningItem = ({ item }) => {
    const payout = parseFloat(item.courier_payout || 0);
    const pickup = truncateAddress(item.pickup_address);
    const dropoff = truncateAddress(item.dropoff_address);

    return (
      <View style={styles.earningItem}>
        <View style={styles.earningLeft}>
          <Text style={styles.earningDate}>
            {formatDate(item.delivered_at)}
          </Text>
          <Text style={styles.earningRoute} numberOfLines={1}>
            {pickup} → {dropoff}
          </Text>
        </View>
        <Text style={styles.earningAmount}>+${payout.toFixed(2)}</Text>
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      {renderEarningsSummary()}
      {renderStripeStatus()}
      {completedDeliveries.length > 0 && (
        <Text style={styles.listSectionTitle}>Completed Deliveries</Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={48} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>No earnings yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete deliveries to start earning
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
      <FlatList
        data={completedDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderEarningItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingHorizontal: SIZES.padding || 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  stripeCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stripeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stripeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark || '#333',
    marginLeft: 8,
  },
  stripeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stripeActiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success || '#22C55E',
    marginLeft: 8,
  },
  stripeSetupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  stripeSetupText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark || '#333',
    marginBottom: 12,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningLeft: {
    flex: 1,
    marginRight: 12,
  },
  earningDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  earningRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark || '#333',
  },
  earningAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.success || '#22C55E',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark || '#333',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 6,
    textAlign: 'center',
  },
});
