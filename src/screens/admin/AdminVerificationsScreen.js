import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - SIZES.lg * 4;

export default function AdminVerificationsScreen({ navigation }) {
  const { profile } = useAuth();

  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchVerifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('id_verifications')
        .select('*, users:user_id(id, email, full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (err) {
      console.error('Error fetching verifications:', err.message);
      Alert.alert('Error', 'Failed to load pending verifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerifications();
  }, [fetchVerifications]);

  const getImageUrl = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from('id-verifications').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const openDetail = (item) => {
    setSelectedVerification(item);
    setShowRejectInput(false);
    setRejectionReason('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVerification(null);
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;

    Alert.alert('Approve Verification', 'Are you sure you want to approve this courier?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setProcessing(true);
          try {
            // Update id_verifications status
            const { error: verifyError } = await supabase
              .from('id_verifications')
              .update({ status: 'approved', reviewed_at: new Date().toISOString() })
              .eq('id', selectedVerification.id);

            if (verifyError) throw verifyError;

            // Update user courier_verified status
            const { error: userError } = await supabase
              .from('users')
              .update({ courier_verified: true })
              .eq('id', selectedVerification.user_id);

            if (userError) throw userError;

            Alert.alert('Success', 'Courier has been approved.');
            closeModal();
            fetchVerifications();
          } catch (err) {
            console.error('Error approving verification:', err.message);
            Alert.alert('Error', 'Failed to approve verification.');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!selectedVerification) return;

    setProcessing(true);
    try {
      const updateData = {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      };

      if (rejectionReason.trim()) {
        updateData.rejection_reason = rejectionReason.trim();
      }

      const { error: verifyError } = await supabase
        .from('id_verifications')
        .update(updateData)
        .eq('id', selectedVerification.id);

      if (verifyError) throw verifyError;

      Alert.alert('Rejected', 'Verification has been rejected.');
      closeModal();
      fetchVerifications();
    } catch (err) {
      console.error('Error rejecting verification:', err.message);
      Alert.alert('Error', 'Failed to reject verification.');
    } finally {
      setProcessing(false);
    }
  };

  const renderVerificationItem = ({ item }) => {
    const userName = item.users?.full_name || item.users?.email || 'Unknown User';
    const userEmail = item.users?.email || '';
    const submittedDate = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.verificationCard}
        onPress={() => openDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userTextInfo}>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
              {userEmail ? (
                <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.submittedDate}>Submitted: {submittedDate}</Text>
          <Text style={styles.tapToReview}>Tap to review</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Pending Verifications</Text>
      <Text style={styles.emptySubtitle}>
        All courier verification requests have been processed.
      </Text>
    </View>
  );

  const renderDetailModal = () => {
    if (!selectedVerification) return null;

    const userName = selectedVerification.users?.full_name || 'Unknown';
    const userEmail = selectedVerification.users?.email || 'N/A';

    const idFrontUrl = getImageUrl(selectedVerification.id_front_path);
    const idBackUrl = getImageUrl(selectedVerification.id_back_path);
    const selfieUrl = getImageUrl(selectedVerification.selfie_path);

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Verification Review</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* User Info */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Applicant</Text>
              <View style={styles.modalInfoCard}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Name</Text>
                  <Text style={styles.modalInfoValue}>{userName}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Email</Text>
                  <Text style={styles.modalInfoValue}>{userEmail}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Submitted</Text>
                  <Text style={styles.modalInfoValue}>
                    {new Date(selectedVerification.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* ID Front Image */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>ID Front</Text>
              {idFrontUrl ? (
                <Image
                  source={{ uri: idFrontUrl }}
                  style={styles.idImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Text style={styles.noImageText}>No image provided</Text>
                </View>
              )}
            </View>

            {/* ID Back Image */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>ID Back</Text>
              {idBackUrl ? (
                <Image
                  source={{ uri: idBackUrl }}
                  style={styles.idImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Text style={styles.noImageText}>No image provided</Text>
                </View>
              )}
            </View>

            {/* Selfie Image */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Selfie</Text>
              {selfieUrl ? (
                <Image
                  source={{ uri: selfieUrl }}
                  style={styles.idImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Text style={styles.noImageText}>No image provided</Text>
                </View>
              )}
            </View>

            {/* Rejection Reason Input */}
            {showRejectInput && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Rejection Reason (optional)</Text>
                <TextInput
                  style={styles.rejectionInput}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="Enter reason for rejection..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                title="Approve"
                onPress={handleApprove}
                variant="secondary"
                loading={processing && !showRejectInput}
                disabled={processing}
                style={styles.approveButton}
              />
              <Button
                title={showRejectInput ? 'Confirm Reject' : 'Reject'}
                onPress={handleReject}
                variant="danger"
                loading={processing && showRejectInput}
                disabled={processing}
                style={styles.rejectButton}
              />
              {showRejectInput && (
                <TouchableOpacity
                  onPress={() => {
                    setShowRejectInput(false);
                    setRejectionReason('');
                  }}
                  style={styles.cancelRejectButton}
                >
                  <Text style={styles.cancelRejectText}>Cancel Rejection</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={verifications}
        keyExtractor={(item) => item.id}
        renderItem={renderVerificationItem}
        contentContainerStyle={
          verifications.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
  },
  verificationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.sm,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  avatarSmallText: {
    ...FONTS.bodyBold,
    color: '#FFFFFF',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  userEmail: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  pendingBadgeText: {
    ...FONTS.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.sm,
  },
  submittedDate: {
    ...FONTS.small,
    color: COLORS.textLight,
  },
  tapToReview: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xl,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.xxl,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: {
    paddingVertical: SIZES.xs,
    paddingRight: SIZES.sm,
  },
  modalCloseText: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  modalHeaderSpacer: {
    width: 50,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  modalSection: {
    marginBottom: SIZES.lg,
  },
  modalSectionTitle: {
    ...FONTS.bodyBold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  modalInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
  },
  modalInfoLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  modalInfoValue: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
  idImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 0.65,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
  noImagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 0.65,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  noImageText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  rejectionInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    ...FONTS.body,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: SIZES.md,
  },
  approveButton: {
    marginBottom: SIZES.sm,
  },
  rejectButton: {
    marginBottom: SIZES.sm,
  },
  cancelRejectButton: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  cancelRejectText: {
    ...FONTS.bodyBold,
    color: COLORS.textSecondary,
  },
});
