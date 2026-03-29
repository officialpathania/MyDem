import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

type Tone = 'neutral' | 'error';

type Props = {
  message: string;
  tone?: Tone;
};

function StatusCalloutInner({ message, tone = 'neutral' }: Props) {
  const borderColor = tone === 'error' ? colors.danger : colors.border;
  const textColor = tone === 'error' ? colors.danger : colors.muted;

  return (
    <View style={[styles.box, { borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export const StatusCallout = memo(StatusCalloutInner);
