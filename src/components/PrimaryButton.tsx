import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
};

function PrimaryButtonInner({ title, onPress, disabled, busy }: Props) {
  const dimmed = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={dimmed}
      style={({ pressed }) => [
        styles.base,
        dimmed && styles.disabled,
        pressed && !dimmed && styles.pressed,
      ]}>
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export const PrimaryButton = memo(PrimaryButtonInner);
