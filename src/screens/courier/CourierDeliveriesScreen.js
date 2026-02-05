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

const FILTER_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const ACTIVE_STATUSES = ['accepted', 'picked_up', 'in_transit'];

export default function CourierDeliveriesScreen({ navigation }) {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('active');

  const fetchMyDeliveries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('courier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (err) {
      console.error('Error fetching my deliveries:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyDeliveries();
  }, [fetchMyDeliveries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyDeliveries();
  }, [fetchMyDeliveries]);

  const getFilteredDeliveries = () => {
    switch (activeFilter) {
      case 'active':
        return deliveries.filter((d) => ACTIVE_STATUSES.includes(d.status));
      case 'completed':
        return deliveries.filter((d) => d.status === 'delivered');
      case 'all':
      default:
        return deliveries;
    }
  };

  const handleDeliveryPress = (item) => {
    navigation.navigate('CourierDeliveryDetail', { deliveryId: item.id });
  };

  const renderFilterTabs = () => (
    <View style={styles.tabContainer}>
      {FILTER_TABS.map((tab) => {
        const isActive = activeFilter === tab.key;
        const count = (() => {
          switch (tab.key) {
            case 'active':
              return deliveries.filter((d) =>
                ACTIVE_STATUSES.includes(d.status)
              ).length;
            case 'completed':
              return deliveries.filter((d) => d.status === 'delivered').length;
            case 'all':
              return deliveries.length;
            default:
              return 0;
          }
        })();

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
            {count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  isActive && styles.activeTabBadge,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    isActive && styles.activeTabBadgeText,
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderDeliveryItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleDeliveryPress(item)}
    >
      <DeliveryCard delivery={item} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={COLORS.gray}
      />
      <Text style={styles.emptyTitle}>No deliveries yet</Text>
      <Text style={styles.emptySubtitle}>
        Browse available deliveries!
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('AvailableDeliveries')}
      >
        <Text style={styles.browseButtonText}>Browse Deliveries</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const filteredDeliveries = getFilteredDeliveries();

  return (
    <View style={styles.container}>
      {renderFilterTabs()}
      <FlatList
        data={filteredDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderDeliveryItem}
        contentContainerStyle={
          filteredDeliveries.length === 0
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white || '#FFFFFF',
    paddingHorizontal: SIZES.padding || 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray || '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.white,
  },
  tabBadge: {
    backgroundColor: COLORS.lightGray || '#E5E5E5',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
  },
  activeTabBadgeText: {
    color: COLORS.white,
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
  browseButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
