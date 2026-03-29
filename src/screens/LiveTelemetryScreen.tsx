import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyValueRow } from '../components/KeyValueRow';
import { StatusCallout } from '../components/StatusCallout';
import { colors, spacing } from '../constants/theme';
import { subscribeTelemetry } from '../native/deviceTelemetry';
import type { BatteryReading, MotionSample } from '../types/deviceTelemetry';
import { debounce } from '../utils/debounce';
import { throttle } from '../utils/throttle';
import {
  beginLiveStream,
  clearLiveSamples,
  endLiveStream,
  patchLiveBattery,
  patchLiveMotion,
} from '../store/deviceTelemetrySlice';
import { useAppDispatch, useAppSelector } from '../store';
import { fixed3, pctLabel } from '../utils/formatters';

export function LiveTelemetryScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const live = useAppSelector(s => s.deviceTelemetry.live);

  const ingestBattery = useMemo(
    () =>
      debounce((reading: BatteryReading) => {
        dispatch(patchLiveBattery(reading));
      }, 340),
    [dispatch],
  );

  const ingestMotion = useMemo(
    () =>
      throttle((sample: MotionSample) => {
        dispatch(patchLiveMotion(sample));
      }, 125),
    [dispatch],
  );

  useEffect(() => {
    let detach: (() => void) | undefined;
    let cancelled = false;

    dispatch(clearLiveSamples());

    (async () => {
      const start = await dispatch(beginLiveStream());
      if (beginLiveStream.rejected.match(start) || cancelled) {
        return;
      }

      detach = subscribeTelemetry(event => {
        if (event.kind === 'battery') {
          ingestBattery(event.payload as BatteryReading);
        } else {
          ingestMotion(event.payload as MotionSample);
        }
      }).remove;
    })();

    return () => {
      cancelled = true;
      detach?.();
      dispatch(endLiveStream());
    };
  }, [dispatch, ingestBattery, ingestMotion]);

  const motion = live.motion;
  const battery = live.battery;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
      <Text style={styles.heading}>Live stream</Text>
      <Text style={styles.sub}>
        Native code pushes battery deltas and accelerometer samples. Redux updates are debounced
        battery and throttled motion
        {/* so React does not repaint on every sensor tick. */}
      </Text>

      {!live.running && !live.error && (
        <View style={styles.centerRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Talking to native…</Text>
        </View>
      )}

      {live.error && (
        <View style={styles.block}>
          <StatusCallout tone="error" message={live.error} />
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.sectionLabel}>Battery</Text>
        {battery ? (
          <>
            <KeyValueRow label="Level" value={pctLabel(battery.levelPercent)} />
            <KeyValueRow label="Charging" value={battery.isCharging ? 'yes' : 'no'} />
          </>
        ) : (
          <Text style={styles.placeholder}>No battery sample yet</Text>
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionLabel}>Accelerometer g </Text>
        {motion ? (
          <>
            <KeyValueRow label="x" value={fixed3(motion.x)} />
            <KeyValueRow label="y" value={fixed3(motion.y)} />
            <KeyValueRow label="z" value={fixed3(motion.z)} />
          </>
        ) : (
          <Text style={styles.placeholder}>Move the phone to populate axes</Text>
        )}
      </View>
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
    marginTop: spacing.md,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  placeholder: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
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
});
