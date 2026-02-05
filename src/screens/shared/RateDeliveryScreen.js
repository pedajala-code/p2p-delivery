import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SIZES, FONTS, DELIVERY_STATUS_LABELS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function RateDeliveryScreen({ navigation, route }) {
  const { deliveryId, revieweeId } = route.params;
  const { user } = useAuth();

  const [delivery, setDelivery] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDelivery();
  }, []);

  const fetchDelivery = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      setDelivery(data);
    } catch (err) {
      console.error('Error fetching delivery:', err.message);
      Alert.alert('Error', 'Failed to load delivery details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        delivery_id: deliveryId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Thank You', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Error submitting review:', err.message);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          activeOpacity={0.7}
          style={styles.starButton}
        >
          <Text style={[styles.starText, { color: i <= rating ? '#F59E0B' : COLORS.disabled }]}>
            {'\u2605'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Delivery Summary */}
          {delivery && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Delivery Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status</Text>
                <Text style={styles.summaryValue}>
                  {DELIVERY_STATUS_LABELS[delivery.status] || delivery.status}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pickup</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {delivery.pickup_address || 'N/A'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Drop-off</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {delivery.dropoff_address || 'N/A'}
                </Text>
              </View>
              {delivery.price != null && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Price</Text>
                  <Text style={styles.summaryValue}>
                    ${parseFloat(delivery.price).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            <Text style={styles.sectionSubtitle}>
              Tap a star to select your rating
            </Text>
            <View style={styles.starsRow}>{renderStars()}</View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Input
              label="Comment (optional)"
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              multiline
              autoCapitalize="sentences"
            />
          </View>

          {/* Submit Button */}
          <Button
            title="Submit Review"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || rating === 0}
            style={styles.submitButton}
          />

          {/* Cancel */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
  },
  summaryLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: SIZES.sm,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  sectionSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
  },
  starText: {
    fontSize: 40,
  },
  ratingLabel: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
    marginTop: SIZES.sm,
  },
  commentSection: {
    marginBottom: SIZES.sm,
  },
  submitButton: {
    marginTop: SIZES.sm,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  cancelText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
});
