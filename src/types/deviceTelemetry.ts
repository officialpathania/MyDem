export type TelemetryKind = 'battery' | 'motion';

export interface BatteryReading {
  levelPercent: number;
  isCharging: boolean;
  /** Present on live stream samples */
  timestampMs?: number;
}

export interface MotionSample {
  x: number;
  y: number;
  z: number;
  timestampMs: number;
}

export interface DeviceInfoSlice {
  brand: string;
  manufacturer: string;
  model: string;
  device: string;
  systemVersion: string;
  appVersion: string;
}

export interface DeviceSnapshot {
  battery: BatteryReading;
  device: DeviceInfoSlice;
}

export interface TelemetryEventEnvelope {
  kind: TelemetryKind;
  payload: BatteryReading | MotionSample;
}
