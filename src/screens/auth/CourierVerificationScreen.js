import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

const STEPS = [
  {
    key: 'idFront',
    label: 'Government ID (Front)',
    description: 'Upload or take a photo of the front of your government-issued ID.',
    fileName: 'id-front.jpg',
  },
  {
    key: 'idBack',
    label: 'Government ID (Back)',
    description: 'Upload or take a photo of the back of your government-issued ID.',
    fileName: 'id-back.jpg',
  },
  {
    key: 'selfie',
    label: 'Selfie',
    description: 'Take a clear selfie of yourself for identity matching.',
    fileName: 'selfie.jpg',
  },
];

const CourierVerificationScreen = () => {
  const { user } = useAuth();

  const [images, setImages] = useState({
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pickImage = async (stepKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to upload your ID.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => ({ ...prev, [stepKey]: result.assets[0].uri }));
    }
  };

  const takePhoto = async (stepKey) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => ({ ...prev, [stepKey]: result.assets[0].uri }));
    }
  };

  const showImageOptions = (stepKey) => {
    const isSelfie = stepKey === 'selfie';

    if (isSelfie) {
      takePhoto(stepKey);
      return;
    }

    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Camera', onPress: () => takePhoto(stepKey) },
      { text: 'Photo Library', onPress: () => pickImage(stepKey) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadImage = async (uri, fileName) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const arrayBuffer = await new Response(blob).arrayBuffer();
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('id-verifications')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('id-verifications')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!images.idFront || !images.idBack || !images.selfie) {
      Alert.alert('Error', 'Please complete all three verification steps.');
      return;
    }

    setSubmitting(true);
    try {
      const idFrontUrl = await uploadImage(images.idFront, 'id-front.jpg');
      const idBackUrl = await uploadImage(images.idBack, 'id-back.jpg');
      const selfieUrl = await uploadImage(images.selfie, 'selfie.jpg');

      const { error } = await supabase.from('id_verifications').insert({
        user_id: user.id,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        status: 'pending',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      Alert.alert(
        'Upload Failed',
        'An error occurred while uploading your documents. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🕐</Text>
          <Text style={styles.successTitle}>Verification Under Review</Text>
          <Text style={styles.successMessage}>
            Your documents have been submitted successfully. Our team will review
            your verification within 24-48 hours. You will be notified once your
            account is approved.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Courier Verification</Text>
          <Text style={styles.subtitle}>
            To ensure safety, we need to verify your identity before you can
            start delivering packages.
          </Text>
        </View>

        {STEPS.map((step, index) => {
          const imageUri = images[step.key];
          return (
            <View key={step.key} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>

              <Text style={styles.stepDescription}>{step.description}</Text>

              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => showImageOptions(step.key)}
                  >
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => showImageOptions(step.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadIcon}>
                    {step.key === 'selfie' ? '📸' : '📄'}
                  </Text>
                  <Text style={styles.uploadText}>
                    {step.key === 'selfie'
                      ? 'Take Selfie'
                      : 'Upload or Take Photo'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {submitting ? (
          <View style={styles.submittingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.submittingText}>
              Uploading your documents...
            </Text>
          </View>
        ) : (
          <Button
            title="Submit for Review"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!images.idFront || !images.idBack || !images.selfie}
            style={styles.submitButton}
          />
        )}
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
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xl,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
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
    lineHeight: 22,
  },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  stepBadgeText: {
    ...FONTS.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLabel: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  stepDescription: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
    lineHeight: 20,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.border,
  },
  retakeButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
  },
  retakeButtonText: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.primary,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: SIZES.sm,
  },
  uploadText: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitButton: {
    marginTop: SIZES.md,
    marginBottom: SIZES.xxl,
  },
  submittingContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  submittingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SIZES.md,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: SIZES.md,
  },
  successTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  successMessage: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default CourierVerificationScreen;
