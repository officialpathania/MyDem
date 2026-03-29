import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyValueRow } from '../components/KeyValueRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusCallout } from '../components/StatusCallout';
import { colors, spacing } from '../constants/theme';
import { loadDeviceSnapshot } from '../store/deviceTelemetrySlice';
import { useAppDispatch, useAppSelector } from '../store';
import { pctLabel } from '../utils/formatters';

export function DeviceInfoScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { status, data, error } = useAppSelector(s => s.deviceTelemetry.snapshot);

  useEffect(() => {
    dispatch(loadDeviceSnapshot());
  }, [dispatch]);

  const onRetry = useCallback(() => {
    dispatch(loadDeviceSnapshot());
  }, [dispatch]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
      <Text style={styles.heading}>On-demand read</Text>
      <Text style={styles.sub}>
        Pulls battery plus static identifiers through the native module. Errors stay on this screen
        until you retry.
      </Text>

      {status === 'loading' && (
        <View style={styles.centerRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Talking to native…</Text>
        </View>
      )}

      {status === 'error' && error && (
        <View style={styles.block}>
          <StatusCallout tone="error" message={error} />
          <View style={{ height: spacing.md }} />
          <PrimaryButton title="Try again" onPress={onRetry} />
        </View>
      )}

      {status === 'success' && data && (
        <View style={styles.block}>
          <Text style={styles.sectionLabel}>Power</Text>
          <KeyValueRow label="Level" value={pctLabel(data.battery.levelPercent)} />
          <KeyValueRow label="Charging" value={data.battery.isCharging ? 'yes' : 'no'} />

          <Text style={[styles.sectionLabel, styles.sectionSpacer]}>Device</Text>
          <KeyValueRow label="Manufacturer" value={data.device.manufacturer || data.device.brand} />
          <KeyValueRow label="Model" value={data.device.model} />
          <KeyValueRow label="Codename" value={data.device.device} />
          <KeyValueRow label="OS" value={data.device.systemVersion} />
          <KeyValueRow label="App version" value={data.device.appVersion || '—'} />

          <View style={{ height: spacing.lg }} />
          <PrimaryButton title="Refresh" onPress={onRetry} />
        </View>
      )}

      {status === 'idle' && <Text style={styles.muted}>Waiting…</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sub: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  block: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionSpacer: {
    marginTop: spacing.lg,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  muted: {
    color: colors.muted,
    marginTop: spacing.md,
  },
});
