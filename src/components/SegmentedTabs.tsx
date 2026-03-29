import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export type AppTab = 'snapshot' | 'live';

type Props = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
};

function SegmentedTabsInner({ active, onChange }: Props) {
  return (
    <View style={styles.track}>
      <TabChip label="Device" selected={active === 'snapshot'} onPress={() => onChange('snapshot')} />
      <TabChip label="Live" selected={active === 'live'} onPress={() => onChange('live')} />
    </View>
  );
}

type ChipProps = { label: string; selected: boolean; onPress: () => void };

function TabChip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.accent,
  },
  chipText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.text,
  },
});

export const SegmentedTabs = memo(SegmentedTabsInner);
