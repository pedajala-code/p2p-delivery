import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }) {
  const { user, profile } = useAuth();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [deliveryUpdates, setDeliveryUpdates] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deletion',
              'Your account deletion request has been submitted. Our team will process it within 48 hours.'
            );
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy page is coming soon.');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service page is coming soon.');
  };

  const renderToggle = (label, value, onValueChange, description) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.disabled, true: COLORS.primaryLight }}
        thumbColor={value ? COLORS.primary : '#F4F4F5'}
        ios_backgroundColor={COLORS.disabled}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.card}>
          {renderToggle(
            'Push Notifications',
            pushNotifications,
            setPushNotifications,
            'Receive push notifications on your device'
          )}
          <View style={styles.separator} />
          {renderToggle(
            'Email Notifications',
            emailNotifications,
            setEmailNotifications,
            'Receive updates via email'
          )}
          <View style={styles.separator} />
          {renderToggle(
            'SMS Notifications',
            smsNotifications,
            setSmsNotifications,
            'Receive text message alerts'
          )}
          <View style={styles.separator} />
          {renderToggle(
            'Delivery Updates',
            deliveryUpdates,
            setDeliveryUpdates,
            'Real-time updates on your deliveries'
          )}
          <View style={styles.separator} />
          {renderToggle(
            'Promotional Emails',
            promotionalEmails,
            setPromotionalEmails,
            'Receive offers and promotions'
          )}
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>Production</Text>
          </View>
        </View>
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkRow} onPress={handlePrivacyPolicy}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>{'>'}</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.linkRow} onPress={handleTermsOfService}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <Text style={styles.linkArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  section: {
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.sm,
    marginLeft: SIZES.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SIZES.md,
  },
  toggleLabel: {
    ...FONTS.body,
    color: COLORS.text,
  },
  toggleDescription: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.xs,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  aboutLabel: {
    ...FONTS.body,
    color: COLORS.text,
  },
  aboutValue: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  linkText: {
    ...FONTS.body,
    color: COLORS.primary,
  },
  linkArrow: {
    ...FONTS.body,
    color: COLORS.textLight,
  },
  deleteRow: {
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  deleteText: {
    ...FONTS.bodyBold,
    color: COLORS.danger,
  },
});
