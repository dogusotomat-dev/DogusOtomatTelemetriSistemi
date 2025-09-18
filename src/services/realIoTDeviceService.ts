import { database } from '../config/firebase';
import { ref, update, get, push, set } from 'firebase/database';
import { MachineService } from './machineService';
import { TelemetryData, Slot } from '../types';

/**
 * Real IoT Device Service
 * Handles communication with real IoT devices
 * Provides endpoints for devices to send heartbeat and telemetry data
 */
export class RealIoTDeviceService {
  
  /**
   * Process heartbeat from real IoT device
   * @param iotNumber - IoT device number
   * @param deviceData - Optional device status data
   */
  static async processDeviceHeartbeat(
    iotNumber: string, 
    deviceData?: {
      batteryLevel?: number;
      signalStrength?: number;
      temperature?: number;
      lastError?: string;
    }
  ): Promise<{ success: boolean; machineId?: string; message: string }> {
    try {
      // Find machine by IoT number
      const machine = await MachineService.getMachineByIoTNumber(iotNumber);
      
      if (!machine) {
        console.warn(`⚠️ No machine found with IoT number: ${iotNumber}`);
        return {
          success: false,
          message: `IoT numarası ${iotNumber} ile makine bulunamadı`
        };
      }

      // Update heartbeat with device data
      await MachineService.updateHeartbeat(machine.id, deviceData);
      
      const machineName = `${machine.name} (${machine.serialNumber})`;
      console.log(`✅ IoT cihazından heartbeat alındı: ${machineName} (${iotNumber})`);
      
      return {
        success: true,
        machineId: machine.id,
        message: `Heartbeat başarıyla işlendi: ${machineName}`
      };
      
    } catch (error) {
      console.error(`❌ Error processing heartbeat from IoT ${iotNumber}:`, error);
      return {
        success: false,
        message: `Heartbeat işlenirken hata oluştu: ${error}`
      };
    }
  }

  /**
   * Process telemetry data from real IoT device
   * @param iotNumber - IoT device number
   * @param telemetryData - Telemetry data from device
   */
  static async processDeviceTelemetry(
    iotNumber: string,
    telemetryData: {
      timestamp?: string;
      powerStatus: boolean;
      doorStatus: boolean;
      temperatureReadings?: {
        internalTemperature: number;
        ambientTemperature: number;
        refrigerationTemperature?: number;
        compressorStatus?: 'on' | 'off' | 'error';
        temperatureZone: string;
      };
      errors?: Array<{
        code: string;
        message: string;
        timestamp: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
      }>;
      slotStatus?: Record<string, Slot>;
      systemInfo?: {
        uptime: number;
        memoryUsage: number;
        diskSpace: number;
      };
      salesData?: {
        todaySales: number;
        todayTransactions: number;
        weeklySales: number;
        monthlySales: number;
        lastSaleTimestamp?: string;
        popularProducts?: Array<{
          productId: string;
          productName: string;
          salesCount: number;
        }>;
      };
      cleaningStatus?: {
        isInCleaningMode: boolean;
        lastCleaningTimestamp?: string;
        daysSinceLastCleaning: number;
      };
    }
  ): Promise<{ success: boolean; machineId?: string; message: string }> {
    try {
      // Find machine by IoT number
      const machine = await MachineService.getMachineByIoTNumber(iotNumber);
      
      if (!machine) {
        console.warn(`⚠️ No machine found with IoT number: ${iotNumber}`);
        return {
          success: false,
          message: `IoT numarası ${iotNumber} ile makine bulunamadı`
        };
      }

      // Prepare telemetry data
      const processedTelemetryData: TelemetryData = {
        timestamp: telemetryData.timestamp || new Date().toISOString(),
        powerStatus: telemetryData.powerStatus,
        doorStatus: telemetryData.doorStatus,
        errors: telemetryData.errors || [],
        slotStatus: telemetryData.slotStatus || {},
        systemInfo: telemetryData.systemInfo || {
          uptime: 0,
          memoryUsage: 0,
          diskSpace: 0
        },
        temperatureReadings: telemetryData.temperatureReadings,
        salesData: telemetryData.salesData,
        cleaningStatus: telemetryData.cleaningStatus
      };

      // Add telemetry data to database
      await MachineService.addTelemetryData(machine.id, processedTelemetryData);
      
      const machineName = `${machine.name} (${machine.serialNumber})`;
      console.log(`✅ IoT cihazından telemetri verisi alındı: ${machineName} (${iotNumber})`);
      
      return {
        success: true,
        machineId: machine.id,
        message: `Telemetri verisi başarıyla işlendi: ${machineName}`
      };
      
    } catch (error) {
      console.error(`❌ Error processing telemetry from IoT ${iotNumber}:`, error);
      return {
        success: false,
        message: `Telemetri verisi işlenirken hata oluştu: ${error}`
      };
    }
  }

  /**
   * Update device-specific status information
   */
  private static async updateDeviceStatus(
    machineId: string, 
    deviceData: {
      batteryLevel?: number;
      signalStrength?: number;
      temperature?: number;
      lastError?: string;
    }
  ): Promise<void> {
    try {
      const deviceStatusRef = ref(database, `machines/${machineId}/deviceStatus`);
      
      const statusUpdate = {
        ...deviceData,
        lastUpdated: new Date().toISOString()
      };
      
      await update(deviceStatusRef, statusUpdate);
      
    } catch (error) {
      console.error(`Error updating device status for machine ${machineId}:`, error);
    }
  }

  /**
   * Register a new IoT device
   * @param iotNumber - IoT device number
   * @param machineId - Associated machine ID
   * @param deviceInfo - Device information
   */
  static async registerIoTDevice(
    iotNumber: string,
    machineId: string,
    deviceInfo: {
      deviceType: string;
      firmwareVersion: string;
      hardwareVersion: string;
      capabilities: string[];
      location?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify machine exists
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        return {
          success: false,
          message: `Makine ${machineId} bulunamadı`
        };
      }

      // Check if IoT number is already registered
      const existingMachine = await MachineService.getMachineByIoTNumber(iotNumber);
      if (existingMachine && existingMachine.id !== machineId) {
        return {
          success: false,
          message: `IoT numarası ${iotNumber} zaten başka bir makineye kayıtlı`
        };
      }

      // Update machine with IoT number
      await MachineService.updateMachine(machineId, {
        iotNumber: iotNumber,
        deviceInfo: {
          ...deviceInfo,
          registeredAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }
      });

      // Initialize heartbeat for the device
      await MachineService.initializeMachineHeartbeat(machineId);

      const machineName = `${machine.name} (${machine.serialNumber})`;
      console.log(`✅ IoT cihazı kaydedildi: ${iotNumber} -> ${machineName}`);
      
      return {
        success: true,
        message: `IoT cihazı başarıyla kayıt edildi: ${machineName}`
      };
      
    } catch (error) {
      console.error(`❌ Error registering IoT device ${iotNumber}:`, error);
      return {
        success: false,
        message: `IoT cihazı kayıt edilirken hata oluştu: ${error}`
      };
    }
  }

  /**
   * Unregister an IoT device
   * @param iotNumber - IoT device number
   */
  static async unregisterIoTDevice(iotNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const machine = await MachineService.getMachineByIoTNumber(iotNumber);
      
      if (!machine) {
        return {
          success: false,
          message: `IoT numarası ${iotNumber} ile makine bulunamadı`
        };
      }

      // Remove IoT number from machine
      await MachineService.updateMachine(machine.id, {
        iotNumber: '',
        deviceInfo: null
      });

      const machineName = `${machine.name} (${machine.serialNumber})`;
      console.log(`✅ IoT cihazı kaydı silindi: ${iotNumber} -> ${machineName}`);
      
      return {
        success: true,
        message: `IoT cihazı kaydı silindi: ${machineName}`
      };
      
    } catch (error) {
      console.error(`❌ Error unregistering IoT device ${iotNumber}:`, error);
      return {
        success: false,
        message: `IoT cihazı kaydı silinirken hata oluştu: ${error}`
      };
    }
  }

  /**
   * Get device status for a specific IoT device
   * @param iotNumber - IoT device number
   */
  static async getDeviceStatus(iotNumber: string): Promise<{
    success: boolean;
    device?: {
      machineId: string;
      machineName: string;
      serialNumber: string;
      status: string;
      lastHeartbeat: string;
      deviceInfo?: any;
      deviceStatus?: any;
    };
    message: string;
  }> {
    try {
      const machine = await MachineService.getMachineByIoTNumber(iotNumber);
      
      if (!machine) {
        return {
          success: false,
          message: `IoT numarası ${iotNumber} ile makine bulunamadı`
        };
      }

      // Get device status
      const deviceStatusRef = ref(database, `machines/${machine.id}/deviceStatus`);
      const deviceStatusSnapshot = await get(deviceStatusRef);
      const deviceStatus = deviceStatusSnapshot.exists() ? deviceStatusSnapshot.val() : null;

      return {
        success: true,
        device: {
          machineId: machine.id,
          machineName: machine.name,
          serialNumber: machine.serialNumber,
          status: machine.connectionInfo.status,
          lastHeartbeat: machine.connectionInfo.lastHeartbeat,
          deviceInfo: machine.deviceInfo,
          deviceStatus: deviceStatus
        },
        message: `IoT cihazı durumu alındı: ${machine.name}`
      };
      
    } catch (error) {
      console.error(`❌ Error getting device status for IoT ${iotNumber}:`, error);
      return {
        success: false,
        message: `IoT cihazı durumu alınırken hata oluştu: ${error}`
      };
    }
  }

  /**
   * Validate IoT device authentication
   * @param iotNumber - IoT device number
   * @param deviceKey - Device authentication key (optional)
   */
  static async validateDeviceAuth(iotNumber: string, deviceKey?: string): Promise<boolean> {
    try {
      const machine = await MachineService.getMachineByIoTNumber(iotNumber);
      
      if (!machine) {
        return false;
      }

      // Basic validation - device exists
      // In a real implementation, you might want to add device key validation
      if (deviceKey && machine.deviceInfo?.deviceKey) {
        return machine.deviceInfo.deviceKey === deviceKey;
      }

      return true; // For now, just check if device exists
      
    } catch (error) {
      console.error(`❌ Error validating device auth for IoT ${iotNumber}:`, error);
      return false;
    }
  }
}

// Development helper functions
if (process.env.NODE_ENV === 'development') {
  (window as any).RealIoTDevice = {
    async heartbeat(iotNumber: string, deviceData?: any) {
      return await RealIoTDeviceService.processDeviceHeartbeat(iotNumber, deviceData);
    },
    
    async telemetry(iotNumber: string, telemetryData: any) {
      return await RealIoTDeviceService.processDeviceTelemetry(iotNumber, telemetryData);
    },
    
    async register(iotNumber: string, machineId: string, deviceInfo: any) {
      return await RealIoTDeviceService.registerIoTDevice(iotNumber, machineId, deviceInfo);
    },
    
    async unregister(iotNumber: string) {
      return await RealIoTDeviceService.unregisterIoTDevice(iotNumber);
    },
    
    async getStatus(iotNumber: string) {
      return await RealIoTDeviceService.getDeviceStatus(iotNumber);
    }
  };
  
  console.log('🔧 Real IoT Device Service loaded!');
  console.log('Available commands in browser console:');
  console.log('- RealIoTDevice.heartbeat("IOT123") // Send heartbeat');
  console.log('- RealIoTDevice.telemetry("IOT123", {...}) // Send telemetry');
  console.log('- RealIoTDevice.register("IOT123", "machineId", {...}) // Cihaz kaydet');
  console.log('- RealIoTDevice.getStatus("IOT123") // Cihaz durumu al\n');
}

export default RealIoTDeviceService;
