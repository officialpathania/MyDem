import CoreMotion
import Foundation
import React
import UIKit

@objc(DeviceTelemetry)
class DeviceTelemetry: RCTEventEmitter {

  private var streamRunning = false
  private var batteryTimer: Timer?
  private let motionManager = CMMotionManager()
  private var batteryObservers: [Any] = []

  private let motionQueue: OperationQueue = {
    let q = OperationQueue()
    q.name = "com.mydem.telemetry.motion"
    q.qualityOfService = .userInitiated
    q.maxConcurrentOperationCount = 1
    return q
  }()

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    ["DeviceTelemetryUpdate"]
  }

  @objc(getDeviceSnapshot:rejecter:)
  func getDeviceSnapshot(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      let snapshot = self.buildSnapshot()
      DispatchQueue.main.async {
        resolve(snapshot)
      }
    }
  }

  @objc(startTelemetryStream:rejecter:)
  func startTelemetryStream(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if streamRunning {
      resolve(true)
      return
    }
    streamRunning = true
    UIDevice.current.isBatteryMonitoringEnabled = true
    subscribeBatteryNotifications()
    startBatteryTimer()
    startMotionIfPossible()
    resolve(true)
  }

  @objc(stopTelemetryStream:rejecter:)
  func stopTelemetryStream(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    stopAll()
    resolve(true)
  }

  private func stopAll() {
    streamRunning = false
    batteryTimer?.invalidate()
    batteryTimer = nil
    for token in batteryObservers {
      NotificationCenter.default.removeObserver(token)
    }
    batteryObservers.removeAll()
    motionManager.stopAccelerometerUpdates()
    UIDevice.current.isBatteryMonitoringEnabled = false
  }

  private func subscribeBatteryNotifications() {
    let nc = NotificationCenter.default
    let a = nc.addObserver(forName: UIDevice.batteryStateDidChangeNotification, object: nil, queue: .main) {
      [weak self] _ in
      self?.emitBatterySample()
    }
    let b = nc.addObserver(forName: UIDevice.batteryLevelDidChangeNotification, object: nil, queue: .main) {
      [weak self] _ in
      self?.emitBatterySample()
    }
    batteryObservers = [a, b]
  }

  private func startBatteryTimer() {
    batteryTimer?.invalidate()
    batteryTimer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { [weak self] _ in
      self?.emitBatterySample()
    }
    emitBatterySample()
  }

  private func emitBatterySample() {
    guard streamRunning else { return }
    UIDevice.current.isBatteryMonitoringEnabled = true
    let level = UIDevice.current.batteryLevel
    let pct = level >= 0 ? Double(level * 100.0) : -1.0
    let state = UIDevice.current.batteryState
    let charging = state == .charging || state == .full
    let payload: [String: Any] = [
      "levelPercent": pct,
      "isCharging": charging,
      "timestampMs": Date().timeIntervalSince1970 * 1000,
    ]
    emit(kind: "battery", payload: payload)
  }

  private func startMotionIfPossible() {
    guard motionManager.isAccelerometerAvailable else { return }
    motionManager.accelerometerUpdateInterval = 0.05
    motionManager.startAccelerometerUpdates(to: motionQueue) { [weak self] data, _ in
      guard let self, self.streamRunning, let sample = data else { return }
      let payload: [String: Any] = [
        "x": sample.acceleration.x,
        "y": sample.acceleration.y,
        "z": sample.acceleration.z,
        "timestampMs": Date().timeIntervalSince1970 * 1000,
      ]
      DispatchQueue.main.async {
        guard self.streamRunning else { return }
        self.emit(kind: "motion", payload: payload)
      }
    }
  }

  private func emit(kind: String, payload: [String: Any]) {
    let body: [String: Any] = ["kind": kind, "payload": payload]
    sendEvent(withName: "DeviceTelemetryUpdate", body: body)
  }

  private func buildSnapshot() -> [String: Any] {
    UIDevice.current.isBatteryMonitoringEnabled = true
    let level = UIDevice.current.batteryLevel
    let pct = level >= 0 ? Double(level * 100.0) : -1.0
    let state = UIDevice.current.batteryState
    let charging = state == .charging || state == .full

    let appVersion = Bundle.makeAppVersionString()
    let machine = hardwareId()

    let device: [String: Any] = [
      "brand": "Apple",
      "manufacturer": "Apple",
      "model": machine,
      "device": machine,
      "systemVersion": UIDevice.current.systemVersion,
      "appVersion": appVersion,
    ]

    return [
      "battery": [
        "levelPercent": pct,
        "isCharging": charging,
      ],
      "device": device,
    ]
  }

  private func hardwareId() -> String {
    var size = 0
    sysctlbyname("hw.machine", nil, &size, nil, 0)
    if size <= 1 {
      return UIDevice.current.model
    }
    var buf = [CChar](repeating: 0, count: size)
    sysctlbyname("hw.machine", &buf, &size, nil, 0)
    return String(cString: buf)
  }
}

private extension Bundle {
  static func makeAppVersionString() -> String {
    guard
      let any = Bundle.main.infoDictionary?["CFBundleShortVersionString"]
    else {
      return ""
    }
    return String(describing: any)
  }
}
