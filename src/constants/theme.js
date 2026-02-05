export const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#818CF8',
  secondary: '#10B981',
  secondaryDark: '#059669',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  disabled: '#D1D5DB',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
};

export const FONTS = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodyBold: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 14, fontWeight: '400' },
  small: { fontSize: 12, fontWeight: '400' },
};

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
};

export const DELIVERY_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const DELIVERY_STATUS_COLORS = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  picked_up: '#8B5CF6',
  in_transit: '#6366F1',
  delivered: '#10B981',
  cancelled: '#EF4444',
  disputed: '#DC2626',
};

export const PACKAGE_SIZES = ['Small', 'Medium', 'Large', 'Extra Large'];

export const COMMISSION_RATE = 0.25;
