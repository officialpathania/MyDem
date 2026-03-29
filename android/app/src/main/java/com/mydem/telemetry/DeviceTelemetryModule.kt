package com.mydem.telemetry

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.atomic.AtomicBoolean

@ReactModule(name = DeviceTelemetryModule.MODULE_NAME)
class DeviceTelemetryModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

  private val streaming = AtomicBoolean(false)
  private var sensorManager: SensorManager? = null
  private var accelerometer: Sensor? = null
  private var batteryReceiver: BroadcastReceiver? = null

  private val accelListener =
    object : SensorEventListener {
      override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type != Sensor.TYPE_ACCELEROMETER) return
        if (!streaming.get()) return
        val payload = Arguments.createMap()
        payload.putDouble("x", event.values[0].toDouble())
        payload.putDouble("y", event.values[1].toDouble())
        payload.putDouble("z", event.values[2].toDouble())
        payload.putDouble("timestampMs", System.currentTimeMillis().toDouble())
        pushEvent("motion", payload)
      }

      override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = MODULE_NAME

  override fun onHostResume() {
    if (streaming.get()) {
      attachMotion()
      attachBattery()
    }
  }

  override fun onHostPause() {
    detachMotion()
    detachBatteryOnly()
  }

  override fun onHostDestroy() {
    shutdownStream(resetFlag = true)
  }

  @ReactMethod
  fun getDeviceSnapshot(promise: Promise) {
    try {
      promise.resolve(buildSnapshot())
    } catch (e: Exception) {
      promise.reject(CODE_TELEMETRY, e.message, e)
    }
  }

  @ReactMethod
  fun startTelemetryStream(promise: Promise) {
    if (streaming.getAndSet(true)) {
      promise.resolve(true)
      return
    }
    attachMotion()
    attachBattery()
    promise.resolve(true)
  }

  @ReactMethod
  fun stopTelemetryStream(promise: Promise) {
    shutdownStream(resetFlag = true)
    promise.resolve(true)
  }

  /** NativeEventEmitter on Android expects these no-op hooks. */
  @ReactMethod
  fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {}

  @ReactMethod
  fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {}

  private fun shutdownStream(resetFlag: Boolean) {
    if (resetFlag) {
      streaming.set(false)
    }
    detachMotion()
    detachBatteryOnly()
  }

  private fun attachMotion() {
    val ctx = reactApplicationContext
    val sm = ctx.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    sensorManager = sm
    accelerometer = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    val sensor = accelerometer ?: return
    sm.registerListener(accelListener, sensor, SensorManager.SENSOR_DELAY_UI)
  }

  private fun detachMotion() {
    sensorManager?.unregisterListener(accelListener)
    sensorManager = null
    accelerometer = null
  }

  private fun attachBattery() {
    if (batteryReceiver != null) return
    batteryReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          if (intent?.action != Intent.ACTION_BATTERY_CHANGED) return
          if (!streaming.get()) return
          val mgr = context?.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
          val level: Int
          val scale: Int
          if (Build.VERSION.SDK_INT >= 21 && mgr != null) {
            level = mgr.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).coerceAtLeast(0)
            scale = 100
          } else {
            level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
          }
          val pct =
            if (level >= 0 && scale > 0) {
              if (Build.VERSION.SDK_INT >= 21 && mgr != null) level.toDouble()
              else (100.0 * level.toDouble() / scale.toDouble())
            } else {
              -1.0
            }
          val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
          val charging =
            status == BatteryManager.BATTERY_STATUS_CHARGING ||
              status == BatteryManager.BATTERY_STATUS_FULL
          val payload = Arguments.createMap()
          payload.putDouble("levelPercent", pct.coerceIn(0.0, 100.0))
          payload.putBoolean("isCharging", charging)
          payload.putDouble("timestampMs", System.currentTimeMillis().toDouble())
          pushEvent("battery", payload)
        }
      }
    reactApplicationContext.registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
  }

  private fun detachBatteryOnly() {
    batteryReceiver?.let { rcv ->
      try {
        reactApplicationContext.unregisterReceiver(rcv)
      } catch (_: Exception) {
      }
    }
    batteryReceiver = null
  }

  private fun pushEvent(kind: String, payload: WritableMap) {
    val body = Arguments.createMap()
    body.putString("kind", kind)
    body.putMap("payload", payload)
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT_NAME, body)
  }

  private fun buildSnapshot(): WritableMap {
    val root = Arguments.createMap()
    val batteryMap = Arguments.createMap()
    val sticky = reactApplicationContext.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    if (sticky != null) {
      val mgr = reactApplicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
      val pct: Double
      if (Build.VERSION.SDK_INT >= 21) {
        val cap = mgr.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        pct = if (cap >= 0) cap.toDouble() else -1.0
      } else {
        val level = sticky.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = sticky.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        pct =
          if (level >= 0 && scale > 0) {
            100.0 * level / scale
          } else {
            -1.0
          }
      }
      val status = sticky.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
      batteryMap.putDouble("levelPercent", pct.coerceIn(0.0, 100.0))
      batteryMap.putBoolean(
        "isCharging",
        status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
      )
    } else {
      batteryMap.putDouble("levelPercent", -1.0)
      batteryMap.putBoolean("isCharging", false)
    }

    val device = Arguments.createMap()
    device.putString("brand", Build.BRAND ?: "")
    device.putString("manufacturer", Build.MANUFACTURER ?: "")
    device.putString("model", Build.MODEL ?: "")
    device.putString("device", Build.DEVICE ?: "")
    device.putString("systemVersion", Build.VERSION.RELEASE ?: "")
    val ver =
      try {
        reactApplicationContext.packageManager
          .getPackageInfo(reactApplicationContext.packageName, PackageManager.GET_META_DATA)
          .versionName
          ?: ""
      } catch (_: Exception) {
        ""
      }
    device.putString("appVersion", ver)

    root.putMap("battery", batteryMap)
    root.putMap("device", device)
    return root
  }

  companion object {
    const val MODULE_NAME = "DeviceTelemetry"
    const val EVENT_NAME = "DeviceTelemetryUpdate"
    private const val CODE_TELEMETRY = "E_DEVICE_TELEMETRY"
  }
}
