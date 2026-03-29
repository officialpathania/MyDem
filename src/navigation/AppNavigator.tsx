import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SegmentedTabs, type AppTab } from '../components/SegmentedTabs';
import { colors, spacing } from '../constants/theme';
import { DeviceInfoScreen } from '../screens/DeviceInfoScreen';
import { LiveTelemetryScreen } from '../screens/LiveTelemetryScreen';

export function AppNavigator() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AppTab>('snapshot');

  const onTab = useCallback((next: AppTab) => {
    setTab(next);
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.tabBar, { paddingTop: insets.top + spacing.sm }]}>
        <SegmentedTabs active={tab} onChange={onTab} />
      </View>
      <View style={styles.body}>{tab === 'snapshot' ? <DeviceInfoScreen /> : <LiveTelemetryScreen />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  body: {
    flex: 1,
  },
});
