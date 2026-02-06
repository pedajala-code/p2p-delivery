import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

// Simple main app content to show after role selection
function MainAppContent({ role, onSignOut }) {
  return (
    <View style={styles.mainContainer}>
      <Text style={styles.mainTitle}>📦 P2P Delivery</Text>
      <Text style={styles.mainSubtitle}>Welcome, {role}!</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Deliveries</Text>
        <Text style={styles.cardText}>📦 Small electronics package</Text>
        <Text style={styles.cardSubtext}>123 Main St → 456 Oak Ave</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎁 Birthday gift</Text>
        <Text style={styles.cardSubtext}>789 Pine Rd → 321 Elm St</Text>
      </View>

      <Pressable style={styles.dangerButton} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const RoleSelectionScreen = () => {
  const { updateProfile, signOut } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [savedRole, setSavedRole] = useState('');

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    await updateProfile({ role: selectedRole });
    setSavedRole(selectedRole);
    setLoading(false);
    setDone(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setDone(false);
    setSelectedRole('');
    setSavedRole('');
  };

  if (done) {
    return <MainAppContent role={savedRole} onSignOut={handleSignOut} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      <Pressable
        style={[styles.roleCard, selectedRole === 'sender' && styles.roleCardSelected]}
        onPress={() => setSelectedRole('sender')}
      >
        <Text style={styles.roleIcon}>📦</Text>
        <Text style={styles.roleText}>Send Packages</Text>
      </Pressable>

      <Pressable
        style={[styles.roleCard, selectedRole === 'courier' && styles.roleCardSelected]}
        onPress={() => setSelectedRole('courier')}
      >
        <Text style={styles.roleIcon}>🚗</Text>
        <Text style={styles.roleText}>Deliver Packages</Text>
      </Pressable>

      <Pressable
        style={[styles.roleCard, selectedRole === 'both' && styles.roleCardSelected]}
        onPress={() => setSelectedRole('both')}
      >
        <Text style={styles.roleIcon}>🔄</Text>
        <Text style={styles.roleText}>Both</Text>
      </Pressable>

      <Pressable
        style={[styles.button, (!selectedRole || loading) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={loading || !selectedRole}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Continue'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  roleIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  roleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  button: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Main app styles
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 40,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#4F46E5',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#111827',
  },
  cardSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  dangerButton: {
    height: 52,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
});

export default RoleSelectionScreen;
