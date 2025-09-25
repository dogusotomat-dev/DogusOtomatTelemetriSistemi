/**
 * IoT Device Simulator
 * This script simulates an actual IoT device sending heartbeat signals
 * to the Doğuş Otomat Telemetri Sistemi.
 * 
 * To use this simulator:
 * 1. Deploy this script to your IoT device
 * 2. Set the MACHINE_ID variable to the actual machine ID
 * 3. Run the script on the device
 */

// Configuration - Set these values for your specific machine
const CONFIG = {
  MACHINE_ID: 'YOUR_MACHINE_ID_HERE', // Replace with actual machine ID
  API_ENDPOINT: 'https://dogusotomattelemetrisistemi.netlify.app/.netlify/functions/update-heartbeat',
  HEARTBEAT_INTERVAL: 60000, // 60 seconds
};

// Device information
const DEVICE_INFO = {
  deviceId: 'sim-' + Math.random().toString(36).substr(2, 9),
  deviceType: 'iot-simulator',
  version: '1.0.0'
};

// State management
let isRunning = false;
let heartbeatInterval = null;

/**
 * Send heartbeat to the server
 */
async function sendHeartbeat() {
  try {
    // Collect device data
    const deviceData = {
      batteryLevel: getBatteryLevel(),
      signalStrength: getSignalStrength(),
      temperature: getDeviceTemperature(),
      timestamp: new Date().toISOString(),
      deviceId: DEVICE_INFO.deviceId
    };

    // Send heartbeat data
    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        machineId: CONFIG.MACHINE_ID,
        deviceData: deviceData
      })
    });

    if (response.ok) {
      console.log(`✅ Heartbeat sent at ${new Date().toLocaleTimeString()}`);
    } else {
      console.error(`❌ Failed to send heartbeat: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error sending heartbeat:', error);
  }
}

/**
 * Get simulated battery level
 */
function getBatteryLevel() {
  // Simulate battery level between 80-100%
  return Math.floor(Math.random() * 21) + 80;
}

/**
 * Get simulated signal strength
 */
function getSignalStrength() {
  // Simulate signal strength between 70-100%
  return Math.floor(Math.random() * 31) + 70;
}

/**
 * Get simulated device temperature
 */
function getDeviceTemperature() {
  // Simulate temperature between 20-30°C
  return Math.floor(Math.random() * 11) + 20;
}

/**
 * Start the heartbeat service
 */
function startHeartbeatService() {
  if (isRunning) {
    console.log('⚠️ Heartbeat service is already running');
    return;
  }

  if (!CONFIG.MACHINE_ID || CONFIG.MACHINE_ID === 'YOUR_MACHINE_ID_HERE') {
    console.error('❌ MACHINE_ID not configured. Please set the MACHINE_ID in the CONFIG object.');
    return;
  }

  console.log(`🚀 Starting IoT Device Simulator for machine: ${CONFIG.MACHINE_ID}`);
  console.log(`📡 Sending heartbeats every ${CONFIG.HEARTBEAT_INTERVAL / 1000} seconds`);

  // Send initial heartbeat
  sendHeartbeat();

  // Start periodic heartbeats
  heartbeatInterval = setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL);
  isRunning = true;

  console.log('✅ IoT Device Simulator started successfully');
}

/**
 * Stop the heartbeat service
 */
function stopHeartbeatService() {
  if (!isRunning) {
    console.log('⚠️ Heartbeat service is not running');
    return;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  isRunning = false;
  console.log('⏹️ IoT Device Simulator stopped');
}

/**
 * Get service status
 */
function getStatus() {
  return {
    isRunning: isRunning,
    machineId: CONFIG.MACHINE_ID,
    deviceId: DEVICE_INFO.deviceId,
    nextHeartbeat: isRunning ? new Date(Date.now() + CONFIG.HEARTBEAT_INTERVAL).toLocaleTimeString() : null
  };
}

// Expose functions globally for testing
window.IoTDeviceSimulator = {
  start: startHeartbeatService,
  stop: stopHeartbeatService,
  getStatus: getStatus,
  sendHeartbeat: sendHeartbeat
};

// Auto-start the service when the script loads
// Uncomment the next line to auto-start
// startHeartbeatService();

console.log('🔧 IoT Device Simulator loaded!');
console.log('To start the simulator, run: IoTDeviceSimulator.start()');
console.log('To stop the simulator, run: IoTDeviceSimulator.stop()');
console.log('To check status, run: IoTDeviceSimulator.getStatus()');