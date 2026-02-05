import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import Input from '../../components/Input';

const PhoneVerificationScreen = ({ navigation }) => {
  const { verifyPhone, verifyOtp } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number.');
      return;
    }

    setSendingCode(true);
    try {
      const { error } = await verifyPhone(phone.trim());
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setCodeSent(true);
        Alert.alert('Code Sent', 'A verification code has been sent to your phone.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const { error } = await verifyOtp(phone.trim(), otp.trim());
      if (error) {
        Alert.alert('Verification Failed', error.message);
      } else {
        navigation.navigate('RoleSelection');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

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
          <View style={styles.headerSection}>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>
              We need your phone number to keep your deliveries secure
            </Text>
          </View>

          <View style={styles.formSection}>
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            {!codeSent ? (
              <Button
                title="Send Code"
                onPress={handleSendCode}
                loading={sendingCode}
                disabled={sendingCode}
                style={styles.actionButton}
              />
            ) : (
              <View>
                <Input
                  label="Verification Code"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />

                <Button
                  title="Verify"
                  onPress={handleVerifyOtp}
                  loading={verifying}
                  disabled={verifying}
                  style={styles.actionButton}
                />

                <Button
                  title="Resend Code"
                  onPress={handleSendCode}
                  loading={sendingCode}
                  disabled={sendingCode}
                  variant="outline"
                  style={styles.resendButton}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xxl,
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
  formSection: {
    marginBottom: SIZES.lg,
  },
  actionButton: {
    marginTop: SIZES.sm,
  },
  resendButton: {
    marginTop: SIZES.md,
  },
});

export default PhoneVerificationScreen;
