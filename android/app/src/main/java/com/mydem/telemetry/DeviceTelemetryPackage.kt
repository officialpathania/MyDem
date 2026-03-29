package com.mydem.telemetry

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Uses [BaseReactPackage] so the module is registered correctly with the New Architecture /
 * TurboModule pipeline (not only the legacy package path).
 */
class DeviceTelemetryPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    if (name != DeviceTelemetryModule.MODULE_NAME) {
      return null
    }
    return DeviceTelemetryModule(reactContext)
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        DeviceTelemetryModule.MODULE_NAME to
          ReactModuleInfo(
            DeviceTelemetryModule.MODULE_NAME,
            DeviceTelemetryModule::class.java.name,
            false,
            false,
            false,
            false,
          ),
      )
    }
  }
}
