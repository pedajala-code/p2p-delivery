import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { COLORS, SIZES, FONTS, DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import DeliveryCard from '../../components/DeliveryCard';

export default function AdminDashboardScreen({ navigation }) {
  const { profile } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeliveries: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch total deliveries
      const { count: totalDeliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true });

      if (deliveriesError) throw deliveriesError;

      // Fetch pending verifications count
      const { count: pendingVerifications, error: verificationsError } = await supabase
        .from('id_verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (verificationsError) throw verificationsError;

      // Fetch total revenue (sum of platform_fee from delivered deliveries)
      const { data: revenueData, error: revenueError } = await supabase
        .from('deliveries')
        .select('platform_fee')
        .eq('status', 'delivered');

      if (revenueError) throw revenueError;

      const totalRevenue = (revenueData || []).reduce(
        (sum, d) => sum + (parseFloat(d.platform_fee) || 0),
        0
      );

      // Fetch recent deliveries
      const { data: recent, error: recentError } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      setStats({
        totalUsers: totalUsers || 0,
        totalDeliveries: totalDeliveries || 0,
        pendingVerifications: pendingVerifications || 0,
        totalRevenue,
      });
      setRecentDeliveries(recent || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
      Alert.alert('Error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to view this page.');
      navigation.goBack();
      return;
    }
    fetchDashboardData();
  }, [profile, fetchDashboardData, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.accessDeniedText}>Access Denied</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Platform overview and management</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
          <Text style={styles.statNumber}>{stats.totalDeliveries}</Text>
          <Text style={styles.statLabel}>Total Deliveries</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
          <Text style={styles.statNumber}>{stats.pendingVerifications}</Text>
          <Text style={styles.statLabel}>Pending Verifications</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
          <Text style={styles.statNumber}>${stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Button
          title={`Pending Verifications (${stats.pendingVerifications})`}
          onPress={() => navigation.navigate('AdminVerifications')}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* Recent Deliveries */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Deliveries</Text>
        {recentDeliveries.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyRecentText}>No deliveries yet.</Text>
          </View>
        ) : (
          recentDeliveries.map((delivery) => (
            <TouchableOpacity
              key={delivery.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Tracking', { deliveryId: delivery.id })}
              style={styles.deliveryItem}
            >
              <View style={styles.deliveryItemHeader}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: DELIVERY_STATUS_COLORS[delivery.status] || COLORS.textLight },
                  ]}
                />
                <Text style={styles.deliveryItemStatus}>
                  {DELIVERY_STATUS_LABELS[delivery.status] || delivery.status}
                </Text>
                <Text style={styles.deliveryItemPrice}>
                  ${parseFloat(delivery.price || delivery.offered_price || 0).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.deliveryItemAddress} numberOfLines={1}>
                {delivery.pickup_address || 'N/A'} → {delivery.dropoff_address || 'N/A'}
              </Text>
              <Text style={styles.deliveryItemDate}>
                {new Date(delivery.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SIZES.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  accessDeniedText: {
    ...FONTS.h2,
    color: COLORS.danger,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.sm,
    marginBottom: SIZES.md,
  },
  statCard: {
    width: '46%',
    margin: '2%',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    minHeight: 100,
    justifyContent: 'center',
  },
  statNumber: {
    ...FONTS.h1,
    color: '#FFFFFF',
    marginBottom: SIZES.xs,
  },
  statLabel: {
    ...FONTS.small,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  actionButton: {
    marginBottom: SIZES.sm,
  },
  recentSection: {
    paddingHorizontal: SIZES.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  emptyRecent: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyRecentText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  deliveryItem: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.sm,
  },
  deliveryItemStatus: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  deliveryItemPrice: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
  deliveryItemAddress: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  deliveryItemDate: {
    ...FONTS.small,
    color: COLORS.textLight,
  },
});
