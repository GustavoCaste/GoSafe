import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme/theme';

type Props = TextInputProps & {
  label: string;
  isPassword?: boolean;
  errorMessage?: string;
};

export function TextField({ label, isPassword = false, errorMessage, ...inputProps }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={typography.label}>{label}</Text>
      <View style={[styles.inputRow, errorMessage ? styles.inputRowError : undefined]}>
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !isVisible}
          autoCapitalize={inputProps.autoCapitalize ?? 'none'}
        />
        {isPassword && (
          <Pressable onPress={() => setIsVisible((current) => !current)} hitSlop={8}>
            <Text style={styles.toggle}>{isVisible ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        )}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    fontSize: 15,
    color: colors.text,
  },
  toggle: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    paddingLeft: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
