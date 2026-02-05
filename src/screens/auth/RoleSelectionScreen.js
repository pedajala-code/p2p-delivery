import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

const RoleSelectionScreen = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');

  if (step === 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Success!</Text>
        <Text style={styles.subtitle}>You selected: {selectedRole}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      <Pressable
        style={[styles.card, selectedRole === 'sender' && styles.cardSelected]}
        onPress={() => setSelectedRole('sender')}
      >
        <Text style={styles.cardText}>📦 Send Packages</Text>
      </Pressable>

      <Pressable
        style={[styles.card, selectedRole === 'courier' && styles.cardSelected]}
        onPress={() => setSelectedRole('courier')}
      >
        <Text style={styles.cardText}>🚗 Deliver Packages</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => {
          if (selectedRole) {
            setStep(2);
          }
        }}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
  subtitle: {
    fontSize: 18,
    color: '#4F46E5',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  button: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;
