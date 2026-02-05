import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import StatusBadge from './StatusBadge';

const truncate = (text, maxLength = 35) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const DeliveryCard = ({ delivery, onPress }) => {
  const {
    pickup_address,
    dropoff_address,
    status,
    offered_price,
    package_size,
  } = delivery || {};

  const displayPrice = parseFloat(offered_price) || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.header}>
        <StatusBadge status={status} />
        <Text style={styles.price}>
          ${displayPrice.toFixed(2)}
        </Text>
      </View>

      <View style={styles.addressSection}>
        <View style={styles.addressRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
          <View style={styles.addressTextWrapper}>
            <Text style={styles.addressLabel}>Pickup</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {truncate(pickup_address)}
            </Text>
          </View>
        </View>

        <View style={styles.connector} />

        <View style={styles.addressRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
          <View style={styles.addressTextWrapper}>
            <Text style={styles.addressLabel}>Drop-off</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {truncate(dropoff_address)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.packageBadge}>
          <Text style={styles.packageText}>{package_size || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  price: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  addressSection: {
    marginBottom: SIZES.sm + 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connector: {
    width: 1.5,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 4.25,
    marginVertical: 2,
  },
  addressTextWrapper: {
    marginLeft: SIZES.sm + 4,
    flex: 1,
  },
  addressLabel: {
    ...FONTS.small,
    color: COLORS.textLight,
  },
  addressText: {
    ...FONTS.caption,
    color: COLORS.text,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.sm + 4,
  },
  packageBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.sm + 4,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  packageText: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

export default DeliveryCard;
