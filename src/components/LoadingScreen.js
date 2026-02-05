import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.brandText}>P2P Delivery</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: SIZES.lg,
  },
  spinner: {
    marginTop: SIZES.sm,
  },
});

export default LoadingScreen;
