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
        console.warn(`⚠️ Machine ${machineId} not found, creating basic record`);
        
        // Create basic machine record for emulator
        await this.createEmulatorMachine(machineId, iotNumber);
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
   * Create basic machine record for emulator
   */
  private static async createEmulatorMachine(machineId: string, iotNumber: string): Promise<void> {
    const machineData = {
      id: machineId, // Add the missing id field
      serialNumber: machineId,
      type: 'ice_cream',
      model: 'DGS-ICE-EMULATOR',
      name: `Emülatör Makinesi ${machineId}`,
      iotNumber: iotNumber,
      location: {
        address: 'Emülatör Lokasyonu',
        latitude: 0,
        longitude: 0
      },
      connectionInfo: {
        version: '1.0.0',
        status: 'online',
        lastHeartbeat: new Date().toISOString()
      },
      configuration: {
        slots: {},
        settings: {
          modes: ['normal'],
          currentMode: 'normal',
          temperature: -15,
          features: {},
          capabilities: {
            hasTemperatureControl: true,
            hasAutoCleaning: false,
            supportedPayments: ['cash']
          }
        },
        notifications: {
          emailAddresses: [],
          enableOfflineAlerts: true,
          enableErrorAlerts: true,
          alertThresholdMinutes: 5
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(ref(database, `machines/${machineId}`), machineData);
    console.log(`✅ Emülatör makine kaydı oluşturuldu: ${machineId}`);
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
