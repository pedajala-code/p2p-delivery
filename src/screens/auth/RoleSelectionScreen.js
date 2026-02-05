import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';

const ROLES = [
  {
    key: 'sender',
    icon: '📦',
    title: 'Send Packages',
    description:
      'Request deliveries and have couriers pick up and deliver your packages across town.',
  },
  {
    key: 'courier',
    icon: '🚗',
    title: 'Deliver Packages',
    description:
      'Earn money by picking up and delivering packages for senders in your area.',
  },
  {
    key: 'both',
    icon: '🔄',
    title: 'Both',
    description:
      'Send packages when you need to and deliver packages when you want to earn.',
  },
];

const RoleSelectionScreen = ({ navigation }) => {
  const { updateProfile } = useAuth();

  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select how you want to use P2P Delivery.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateProfile({ role: selectedRole });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        if (selectedRole === 'courier' || selectedRole === 'both') {
          navigation.navigate('CourierVerification');
        }
        // If sender, navigation is handled by the navigator
        // (profile now has a role, so the auth navigator will redirect)
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>How will you use P2P Delivery?</Text>
          <Text style={styles.subtitle}>
            You can always change this later in your settings
          </Text>
        </View>

        <View style={styles.cardsSection}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.key;
            return (
              <TouchableOpacity
                key={role.key}
                activeOpacity={0.7}
                onPress={() => setSelectedRole(role.key)}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
              >
                <Text style={styles.cardIcon}>{role.icon}</Text>
                <Text
                  style={[
                    styles.cardTitle,
                    isSelected && styles.cardTitleSelected,
                  ]}
                >
                  {role.title}
                </Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
                {isSelected && <View style={styles.selectedIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={loading || !selectedRole}
          style={styles.continueButton}
        />
      </View>
    </ScrollView>
  );
};

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
    paddingVertical: SIZES.xxl,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: SIZES.xl,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  cardsSection: {
    marginBottom: SIZES.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: SIZES.sm,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  cardTitleSelected: {
    color: COLORS.primary,
  },
  cardDescription: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 32,
    borderLeftWidth: 32,
    borderTopColor: COLORS.primary,
    borderLeftColor: 'transparent',
  },
  continueButton: {
    marginTop: SIZES.sm,
  },
});

export default RoleSelectionScreen;
