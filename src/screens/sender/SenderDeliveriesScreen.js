import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SIZES,
  FONTS,
  DELIVERY_STATUS,
} from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import DeliveryCard from '../../components/DeliveryCard';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES = [
  DELIVERY_STATUS.PENDING,
  DELIVERY_STATUS.ACCEPTED,
  DELIVERY_STATUS.PICKED_UP,
  DELIVERY_STATUS.IN_TRANSIT,
];

const SenderDeliveriesScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    try {
      let query = supabase
        .from('deliveries')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (activeFilter === 'active') {
        query = query.in('status', ACTIVE_STATUSES);
      } else if (activeFilter === 'completed') {
        query = query.eq('status', DELIVERY_STATUS.DELIVERED);
      } else if (activeFilter === 'cancelled') {
        query = query.eq('status', DELIVERY_STATUS.CANCELLED);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Refetch when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDeliveries();
    });
    return unsubscribe;
  }, [navigation, fetchDeliveries]);

  function handleRefresh() {
    setRefreshing(true);
    fetchDeliveries();
  }

  function handleCardPress(item) {
    navigation.navigate('DeliveryDetail', { deliveryId: item.id });
  }

  function renderFilterTabs() {
    return (
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderEmptyState() {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="cube-outline"
          size={64}
          color={COLORS.disabled}
        />
        <Text style={styles.emptyTitle}>No deliveries yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first delivery!
        </Text>
      </View>
    );
  }

  function renderItem({ item }) {
    return (
      <DeliveryCard
        delivery={item}
        onPress={() => handleCardPress(item)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterTabs()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            deliveries.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateDelivery')}
        activeOpacity={0.85}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.sm,
  },
  filterTab: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SIZES.md,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xl,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptySubtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.xs,
  },
  fab: {
    position: 'absolute',
    bottom: SIZES.lg,
    right: SIZES.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});

export default SenderDeliveriesScreen;
