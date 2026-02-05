import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  COLORS,
  SIZES,
  FONTS,
  DELIVERY_STATUS_COLORS,
  DELIVERY_STATUS_LABELS,
} from '../constants/theme';

const StatusBadge = ({ status }) => {
  const backgroundColor = DELIVERY_STATUS_COLORS[status] || COLORS.textLight;
  const label = DELIVERY_STATUS_LABELS[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: backgroundColor + '1A' }]}>
      <View style={[styles.dot, { backgroundColor }]} />
      <Text style={[styles.label, { color: backgroundColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm + 2,
    paddingVertical: SIZES.xs + 2,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SIZES.xs + 2,
  },
  label: {
    ...FONTS.small,
    fontWeight: '600',
  },
});

export default StatusBadge;
