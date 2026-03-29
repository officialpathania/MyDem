import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BatteryReading, DeviceSnapshot, MotionSample } from '../types/deviceTelemetry';
import {
  fetchDeviceSnapshot,
  startTelemetryStream,
  stopTelemetryStream,
} from '../native/deviceTelemetry';

const SNAPSHOT_MIN_LOADING_MS = 800;
const LIVE_STREAM_MIN_LOADING_MS = 800;

export type SnapshotStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DeviceTelemetryState {
  snapshot: {
    status: SnapshotStatus;
    data: DeviceSnapshot | null;
    error: string | null;
  };
  live: {
    running: boolean;
    battery: BatteryReading | null;
    motion: MotionSample | null;
    error: string | null;
  };
}

const initialState: DeviceTelemetryState = {
  snapshot: {
    status: 'idle',
    data: null,
    error: null,
  },
  live: {
    running: false,
    battery: null,
    motion: null,
    error: null,
  },
};

export const loadDeviceSnapshot = createAsyncThunk<DeviceSnapshot, void, { rejectValue: string }>(
  'deviceTelemetry/loadSnapshot',
  async (_, { rejectWithValue }) => {
    const startedAt = Date.now();
    try {
      const snapshot = await fetchDeviceSnapshot();
      const elapsed = Date.now() - startedAt;
      if (elapsed < SNAPSHOT_MIN_LOADING_MS) {
        await new Promise<void>(resolve =>
          setTimeout(() => resolve(), SNAPSHOT_MIN_LOADING_MS - elapsed),
        );
      }
      return snapshot;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not read device snapshot';
      return rejectWithValue(message);
    }
  },
);

export const beginLiveStream = createAsyncThunk<void, void, { rejectValue: string }>(
  'deviceTelemetry/beginStream',
  async (_, { rejectWithValue }) => {
    const startedAt = Date.now();
    try {
      await startTelemetryStream();
      const elapsed = Date.now() - startedAt;
      if (elapsed < LIVE_STREAM_MIN_LOADING_MS) {
        await new Promise<void>(resolve =>
          setTimeout(() => resolve(), LIVE_STREAM_MIN_LOADING_MS - elapsed),
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not start stream';
      return rejectWithValue(message);
    }
  },
);

export const endLiveStream = createAsyncThunk<void, void, { rejectValue: string }>(
  'deviceTelemetry/endStream',
  async (_, { rejectWithValue }) => {
    try {
      await stopTelemetryStream();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not stop stream';
      return rejectWithValue(message);
    }
  },
);

const slice = createSlice({
  name: 'deviceTelemetry',
  initialState,
  reducers: {
    patchLiveBattery(state, action: PayloadAction<BatteryReading>) {
      state.live.battery = action.payload;
    },
    patchLiveMotion(state, action: PayloadAction<MotionSample>) {
      state.live.motion = action.payload;
    },
    clearLiveSamples(state) {
      state.live.battery = null;
      state.live.motion = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadDeviceSnapshot.pending, state => {
        state.snapshot.status = 'loading';
        state.snapshot.error = null;
      })
      .addCase(loadDeviceSnapshot.fulfilled, (state, action) => {
        state.snapshot.status = 'success';
        state.snapshot.data = action.payload;
      })
      .addCase(loadDeviceSnapshot.rejected, (state, action) => {
        state.snapshot.status = 'error';
        state.snapshot.error = action.payload ?? action.error.message ?? 'error';
      })
      .addCase(beginLiveStream.pending, state => {
        state.live.error = null;
      })
      .addCase(beginLiveStream.fulfilled, state => {
        state.live.running = true;
      })
      .addCase(beginLiveStream.rejected, (state, action) => {
        state.live.running = false;
        state.live.error = action.payload ?? action.error.message ?? 'error';
      })
      .addCase(endLiveStream.fulfilled, state => {
        state.live.running = false;
      })
      .addCase(endLiveStream.rejected, (state, action) => {
        state.live.error = action.payload ?? action.error.message ?? 'error';
      });
  },
});

export const { patchLiveBattery, patchLiveMotion, clearLiveSamples } = slice.actions;
export const deviceTelemetryReducer = slice.reducer;
