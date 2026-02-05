import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  const backgroundColors = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    outline: 'transparent',
    danger: COLORS.danger,
  };

  const textColors = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: COLORS.primary,
    danger: '#FFFFFF',
  };

  const borderColors = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    outline: COLORS.primary,
    danger: COLORS.danger,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isDisabled
            ? COLORS.disabled
            : backgroundColors[variant],
          borderColor: isDisabled ? COLORS.disabled : borderColors[variant],
          opacity: pressed ? 0.8 : 1,
          cursor: Platform.OS === 'web' ? (isDisabled ? 'not-allowed' : 'pointer') : undefined,
        },
        variant === 'outline' && styles.outlineBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? COLORS.primary : '#FFFFFF'}
        />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: isDisabled ? COLORS.textLight : textColors[variant],
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.lg,
  },
  outlineBorder: {
    borderWidth: 1.5,
  },
  text: {
    ...FONTS.bodyBold,
  },
});

export default Button;
