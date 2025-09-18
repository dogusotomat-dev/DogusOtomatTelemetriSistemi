import { MachineService } from './machineService';

/**
 * IoT Device Heartbeat Service
 * This service should run on actual IoT devices to send heartbeat signals
 * to the central system. This replaces the simulator in production.
 * 
 * This service is designed to be included in the IoT device firmware
 * and should be called periodically to send heartbeat signals.
 */
export class IoTDeviceHeartbeatService {
  private static isServiceRunning = false;
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private static machineId: string | null = null;

  /**
   * Initialize the heartbeat service with machine ID
   * @param machineId - The machine ID this IoT device represents
   */
  static async initialize(machineId: string): Promise<void> {
    if (this.isServiceRunning) {
      console.warn('IoT Device Heartbeat Service is already running');
      return;
    }

    this.machineId = machineId;
    this.isServiceRunning = true;
    
    console.log(`🚀 IoT Cihaz Heartbeat Servisi makine için başlatıldı: ${machineId}`);
    
    // Send initial heartbeat
    await this.sendHeartbeat();
    
    // Start periodic heartbeats
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
    
    console.log(`✅ IoT Device Heartbeat Service started successfully`);
  }

  /**
   * Stop the heartbeat service
   */
  static async stop(): Promise<void> {
    if (!this.isServiceRunning) {
      console.warn('IoT Device Heartbeat Service is not running');
      return;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.isServiceRunning = false;
    console.log('⏹️ IoT Device Heartbeat Service stopped');
  }

  /**
   * Send a heartbeat signal for this machine
   */
  static async sendHeartbeat(): Promise<void> {
    if (!this.machineId) {
      console.error('❌ Machine ID not set. Cannot send heartbeat.');
      return;
    }

    try {
      // Collect device data
      const deviceData = {
        batteryLevel: this.getBatteryLevel(),
        signalStrength: this.getSignalStrength(),
        temperature: this.getDeviceTemperature(),
        lastError: null as string | null
      };

      await MachineService.updateHeartbeat(this.machineId, deviceData);
      console.log(`✅ Makine için heartbeat gönderildi: ${this.machineId}`);
    } catch (error) {
      console.error(`❌ Failed to send heartbeat for machine ${this.machineId}:`, error);
    }
  }

  /**
   * Simulate getting battery level (replace with actual hardware reading)
   */
  private static getBatteryLevel(): number {
    // In a real IoT device, this would read from hardware
    // For simulation, we'll return a random value between 80-100%
    return Math.floor(Math.random() * 21) + 80;
  }

  /**
   * Simulate getting signal strength (replace with actual hardware reading)
   */
  private static getSignalStrength(): number {
    // In a real IoT device, this would read from network hardware
    // For simulation, we'll return a random value between 70-100%
    return Math.floor(Math.random() * 31) + 70;
  }

  /**
   * Simulate getting device temperature (replace with actual hardware reading)
   */
  private static getDeviceTemperature(): number {
    // In a real IoT device, this would read from temperature sensor
    // For simulation, we'll return a random value between 20-30°C
    return Math.floor(Math.random() * 11) + 20;
  }

  /**
   * Send an error heartbeat
   * @param errorCode - Error code
   * @param errorMessage - Error message
   */
  static async sendError(errorCode: string, errorMessage: string): Promise<void> {
    if (!this.machineId) {
      console.error('❌ Machine ID not set. Cannot send error.');
      return;
    }

    try {
      const deviceData = {
        batteryLevel: this.getBatteryLevel(),
        signalStrength: this.getSignalStrength(),
        temperature: this.getDeviceTemperature(),
        lastError: `${errorCode}: ${errorMessage}`
      };

      await MachineService.updateHeartbeat(this.machineId, deviceData);
      console.log(`🚨 Makine için hata heartbeat gönderildi: ${this.machineId} - ${errorCode}`);
    } catch (error) {
      console.error(`❌ Failed to send error heartbeat for machine ${this.machineId}:`, error);
    }
  }

  /**
   * Get service status
   */
  static getStatus(): { 
    isRunning: boolean; 
    machineId: string | null; 
    nextHeartbeat: string | null 
  } {
    return {
      isRunning: this.isServiceRunning,
      machineId: this.machineId,
      nextHeartbeat: this.heartbeatInterval ? new Date(Date.now() + this.HEARTBEAT_INTERVAL).toISOString() : null
    };
  }
}

// Make available globally for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).IoTDeviceHeartbeatService = IoTDeviceHeartbeatService;
  
  console.log('🔧 IoT Device Heartbeat Service loaded!');
  console.log('Tarayıcı konsolunda mevcut komutlar:');
  console.log('- IoTDeviceHeartbeatService.initialize("machineId") // Makine ID ile başlat');
  console.log('- IoTDeviceHeartbeatService.sendHeartbeat() // Manuel heartbeat gönder');
  console.log('- IoTDeviceHeartbeatService.sendError("ERROR_CODE", "Error message") // Send error');
  console.log('- IoTDeviceHeartbeatService.getStatus() // Get service status');
  console.log('- IoTDeviceHeartbeatService.stop() // Stop service\n');
}

export default IoTDeviceHeartbeatService;