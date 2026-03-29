import { NativeEventEmitter, NativeModules, type NativeModule } from 'react-native';
import type { DeviceSnapshot, TelemetryEventEnvelope, TelemetryKind } from '../types/deviceTelemetry';

type NativeModuleShape = {
  getDeviceSnapshot: () => Promise<Record<string, unknown>>;
  startTelemetryStream: () => Promise<boolean>;
  stopTelemetryStream: () => Promise<boolean>;
  addListener?: (eventType: string) => void;
  removeListeners?: (count: number) => void;
};

const native = NativeModules.DeviceTelemetry as NativeModuleShape | undefined;

export const TELEMETRY_EVENT = 'DeviceTelemetryUpdate';

function assertModule(): NativeModuleShape {
  if (
    !native ||
    typeof native.getDeviceSnapshot !== 'function' ||
    typeof native.startTelemetryStream !== 'function'
  ) {
    throw new Error('DeviceTelemetry native module is not linked.');
  }
  return native;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function normalizeSnapshot(raw: Record<string, unknown>): DeviceSnapshot {
  const bat = (raw.battery as Record<string, unknown>) || {};
  const dev = (raw.device as Record<string, unknown>) || {};

  return {
    battery: {
      levelPercent: asNumber(bat.levelPercent, -1),
      isCharging: asBool(bat.isCharging),
    },
    device: {
      brand: asString(dev.brand),
      manufacturer: asString(dev.manufacturer),
      model: asString(dev.model),
      device: asString(dev.device),
      systemVersion: asString(dev.systemVersion),
      appVersion: asString(dev.appVersion),
    },
  };
}

export async function fetchDeviceSnapshot(): Promise<DeviceSnapshot> {
  const mod = assertModule();
  const raw = await mod.getDeviceSnapshot();
  return normalizeSnapshot(raw);
}

export async function startTelemetryStream(): Promise<void> {
  await assertModule().startTelemetryStream();
}

export async function stopTelemetryStream(): Promise<void> {
  await assertModule().stopTelemetryStream();
}

export function subscribeTelemetry(
  listener: (event: TelemetryEventEnvelope) => void,
): { remove: () => void } {
  const mod = assertModule();
  const bus = new NativeEventEmitter(mod as NativeModule);
  const sub = bus.addListener(TELEMETRY_EVENT, (body: unknown) => {
    const parsed = parseTelemetryEvent(body);
    if (parsed) {
      listener(parsed);
    }
  });
  return { remove: () => sub.remove() };
}

export function parseTelemetryEvent(raw: unknown): TelemetryEventEnvelope | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const kind = o.kind as TelemetryKind | undefined;
  const payload = o.payload as Record<string, unknown> | undefined;
  if ((kind !== 'battery' && kind !== 'motion') || !payload) {
    return null;
  }
  if (kind === 'battery') {
    return {
      kind,
      payload: {
        levelPercent: asNumber(payload.levelPercent, -1),
        isCharging: asBool(payload.isCharging),
        timestampMs:
          'timestampMs' in payload && typeof payload.timestampMs === 'number'
            ? payload.timestampMs
            : undefined,
      },
    };
  }
  return {
    kind: 'motion',
    payload: {
      x: asNumber(payload.x),
      y: asNumber(payload.y),
      z: asNumber(payload.z),
      timestampMs: asNumber(payload.timestampMs),
    },
  };
}
