import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  COLORS,
  SIZES,
  FONTS,
  PACKAGE_SIZES,
  COMMISSION_RATE,
} from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import Input from '../../components/Input';

const CreateDeliveryScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageSize, setPackageSize] = useState(PACKAGE_SIZES[0]);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const numericPrice = parseFloat(offeredPrice) || 0;
  const platformFee = numericPrice * COMMISSION_RATE;
  const courierPayout = numericPrice - platformFee;

  function validate() {
    const newErrors = {};

    if (!pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }
    if (!dropoffAddress.trim()) {
      newErrors.dropoffAddress = 'Dropoff address is required';
    }
    if (!packageDescription.trim()) {
      newErrors.packageDescription = 'Package description is required';
    }
    if (!offeredPrice || numericPrice <= 0) {
      newErrors.offeredPrice = 'Please enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('deliveries').insert({
        sender_id: user.id,
        pickup_address: pickupAddress.trim(),
        dropoff_address: dropoffAddress.trim(),
        package_description: packageDescription.trim(),
        package_size: packageSize,
        offered_price: numericPrice,
        platform_fee: parseFloat(platformFee.toFixed(2)),
        courier_payout: parseFloat(courierPayout.toFixed(2)),
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert(
        'Delivery Created',
        'Your delivery request has been posted. Couriers will be notified!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePriceChange(text) {
    // Allow only digits and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setOfferedPrice(cleaned);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Create Delivery</Text>
        <Text style={styles.subheading}>
          Fill in the details below to request a courier delivery.
        </Text>

        {/* Pickup Address */}
        <Input
          label="Pickup Address"
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Enter pickup address"
          error={errors.pickupAddress}
          autoCapitalize="words"
        />

        {/* Dropoff Address */}
        <Input
          label="Dropoff Address"
          value={dropoffAddress}
          onChangeText={setDropoffAddress}
          placeholder="Enter dropoff address"
          error={errors.dropoffAddress}
          autoCapitalize="words"
        />

        {/* Package Description */}
        <Input
          label="Package Description"
          value={packageDescription}
          onChangeText={setPackageDescription}
          placeholder="Describe your package"
          error={errors.packageDescription}
          multiline
        />

        {/* Package Size Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Package Size</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {PACKAGE_SIZES.map((size) => {
              const isSelected = packageSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  onPress={() => setPackageSize(size)}
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Offered Price */}
        <Input
          label="Offered Price ($)"
          value={offeredPrice}
          onChangeText={handlePriceChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.offeredPrice}
        />

        {/* Fee Breakdown */}
        {numericPrice > 0 && (
          <View style={styles.feeCard}>
            <Text style={styles.feeTitle}>Price Breakdown</Text>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Offered Price</Text>
              <Text style={styles.feeValue}>${numericPrice.toFixed(2)}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>
                Platform fee ({(COMMISSION_RATE * 100).toFixed(0)}%)
              </Text>
              <Text style={[styles.feeValue, { color: COLORS.danger }]}>
                -${platformFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.feeDivider} />

            <View style={styles.feeRow}>
              <Text style={styles.feeLabelBold}>Courier receives</Text>
              <Text style={[styles.feeValueBold, { color: COLORS.secondary }]}>
                ${courierPayout.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title="Post Delivery Request"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  heading: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  subheading: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },
  fieldGroup: {
    marginBottom: SIZES.md,
  },
  label: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  chip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  feeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feeTitle: {
    ...FONTS.bodyBold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
  },
  feeLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  feeValue: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
  feeLabelBold: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  feeValueBold: {
    ...FONTS.bodyBold,
  },
  feeDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.sm,
  },
  submitButton: {
    marginTop: SIZES.sm,
  },
});

export default CreateDeliveryScreen;
