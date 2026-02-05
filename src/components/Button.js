import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
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

  const pressedBackgrounds = {
    primary: COLORS.primaryDark,
    secondary: COLORS.secondaryDark,
    outline: COLORS.border,
    danger: '#DC2626',
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
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: isDisabled
            ? COLORS.disabled
            : backgroundColors[variant],
          borderColor: isDisabled ? COLORS.disabled : borderColors[variant],
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
    </TouchableOpacity>
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
