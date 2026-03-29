import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = {
  label: string;
  value: string;
};

function KeyValueRowInner({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    color: colors.text,
    fontSize: 16,
  },
});

export const KeyValueRow = memo(KeyValueRowInner);
