import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function ProfileScreen({ navigation }) {
  const { user, profile, signOut, updateProfile, refreshProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name is required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });

      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      console.error('Error updating profile:', err.message);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          } catch (err) {
            Alert.alert('Error', 'An unexpected error occurred.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isCourier = profile.role === 'courier';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{profile.full_name || 'No Name Set'}</Text>
        <Text style={styles.userEmail}>{user?.email || profile.email}</Text>

        {/* Role Badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {(profile.role || 'user').charAt(0).toUpperCase() + (profile.role || 'user').slice(1)}
          </Text>
        </View>

        {/* Courier Verification Badge */}
        {isCourier && (
          <View
            style={[
              styles.verificationBadge,
              {
                backgroundColor: profile.courier_verified
                  ? COLORS.secondary
                  : COLORS.warning,
              },
            ]}
          >
            <Text style={styles.verificationBadgeText}>
              {profile.courier_verified ? 'Verified Courier' : 'Unverified'}
            </Text>
          </View>
        )}
      </View>

      {/* Profile Info / Edit */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditButton}>
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <Button
                title="Save"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              />
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{profile.full_name || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || profile.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phone || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {(profile.role || 'user').charAt(0).toUpperCase() + (profile.role || 'user').slice(1)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {isCourier && (
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('CourierEarnings')}
          >
            <Text style={styles.actionText}>Earnings</Text>
            <Text style={styles.actionArrow}>{'>'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => navigation.navigate('DeliveryHistory')}
        >
          <Text style={styles.actionText}>Delivery History</Text>
          <Text style={styles.actionArrow}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.actionText}>Settings</Text>
          <Text style={styles.actionArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <View style={styles.signOutSection}>
        <Button
          title={signingOut ? 'Signing Out...' : 'Sign Out'}
          onPress={handleSignOut}
          variant="danger"
          loading={signingOut}
          disabled={signingOut}
          style={styles.signOutButton}
        />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  avatarText: {
    ...FONTS.h1,
    color: '#FFFFFF',
  },
  userName: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.xs,
  },
  roleBadgeText: {
    ...FONTS.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verificationBadge: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.xs,
  },
  verificationBadgeText: {
    ...FONTS.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  editLink: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: SIZES.sm,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SIZES.sm,
  },
  cancelEditButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.sm,
  },
  cancelEditText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
  saveButton: {
    minWidth: 100,
  },
  actionsSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  actionArrow: {
    ...FONTS.body,
    color: COLORS.textLight,
  },
  signOutSection: {
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.lg,
  },
  signOutButton: {
    marginTop: SIZES.xs,
  },
});
