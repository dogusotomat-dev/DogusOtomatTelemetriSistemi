import { database } from '../config/firebase';
import { ref, set, update, get } from 'firebase/database';
import { MachineService } from './machineService';

/**
 * Emulator Heartbeat Service
 * Handles heartbeat data from emulator devices
 * Bypasses Netlify Functions and works directly with Firebase
 */
export class EmulatorHeartbeatService {
  
  /**
   * Process heartbeat from emulator device
   * @param machineId - Machine ID from emulator
   * @param iotNumber - IoT number from emulator
   * @param deviceData - Optional device status data
   */
  static async processEmulatorHeartbeat(
    machineId: string,
    iotNumber: string,
    deviceData?: {
      batteryLevel?: number;
      signalStrength?: number;
      temperature?: number;
      lastError?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Emülatör heartbeat işleniyor: Makine ${machineId}, IoT ${iotNumber}`);
      
      // Check if machine exists
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        console.error(`❌ Machine ${machineId} not found - automatic creation disabled`);
        return {
          success: false,
          message: `Machine ${machineId} does not exist. Please create the machine manually through the admin interface.`
        };
      }
      
      const timestamp = new Date().toISOString();
      const now = Date.now();
      
      // Update heartbeat in the format system expects
      await set(ref(database, `heartbeat/${machineId}`), {
        status: 'online',
        lastSeen: now,
        timestamp: timestamp,
        machineId: machineId,
        iotNumber: iotNumber,
        ...deviceData
      });
      
      // Update machine connection info
      await update(ref(database, `machines/${machineId}/connectionInfo`), {
        status: 'online',
        lastHeartbeat: timestamp
      });
      
      // Update device status if provided
      if (deviceData) {
        await set(ref(database, `machines/${machineId}/deviceStatus`), {
          ...deviceData,
          lastUpdated: timestamp
        });
      }
      
      console.log(`✅ Emülatör heartbeat başarıyla işlendi: Makine ${machineId}`);
      
      return {
        success: true,
        message: `Heartbeat başarıyla işlendi: Machine ${machineId}`
      };
      
    } catch (error) {
      console.error(`❌ Error processing emulator heartbeat:`, error);
      return {
        success: false,
        message: `Heartbeat işlenirken hata oluştu: ${error}`
      };
    }
  }
  
  /**
   * Create basic machine record for emulator - DISABLED
   * This function is disabled to prevent automatic test machine creation
   */
  private static async createEmulatorMachine(machineId: string, iotNumber: string): Promise<void> {
    // DISABLED: Automatic machine creation is not allowed
    throw new Error(`Automatic machine creation is disabled. Please create machine ${machineId} manually through the admin interface.`);
  }
  
  /**
   * Process telemetry from emulator
   */
  static async processEmulatorTelemetry(
    machineId: string,
    iotNumber: string,
    telemetryData: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Emülatör telemetri işleniyor: Makine ${machineId}`);
      
      // Add telemetry data
      await MachineService.addTelemetryData(machineId, {
        timestamp: new Date().toISOString(),
        powerStatus: telemetryData.powerStatus || true,
        doorStatus: telemetryData.doorStatus || false,
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
      });
      
      console.log(`✅ Emülatör telemetri başarıyla işlendi: Makine ${machineId}`);
      
      return {
        success: true,
        message: `Telemetri başarıyla işlendi: Machine ${machineId}`
      };
      
    } catch (error) {
      console.error(`❌ Error processing emulator telemetry:`, error);
      return {
        success: false,
        message: `Telemetri işlenirken hata oluştu: ${error}`
      };
    }
  }
}

export default EmulatorHeartbeatService;
