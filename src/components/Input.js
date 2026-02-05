import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  leftIcon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? COLORS.danger
    : isFocused
    ? COLORS.primary
    : COLORS.border;

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          multiline && styles.multilineWrapper,
        ]}
      >
        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            leftIcon && styles.inputWithIcon,
            multiline && styles.multilineInput,
          ]}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    ...FONTS.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface,
    height: 50,
    paddingHorizontal: SIZES.md,
  },
  multilineWrapper: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: SIZES.sm,
  },
  iconContainer: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
    height: '100%',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  multilineInput: {
    height: '100%',
  },
  errorText: {
    ...FONTS.small,
    color: COLORS.danger,
    marginTop: SIZES.xs,
  },
});

export default Input;
