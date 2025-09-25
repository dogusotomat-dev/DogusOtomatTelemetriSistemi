import { database } from '../config/firebase';
import { ref, set, update, get } from 'firebase/database';

/**
 * Direct Firebase Service
 * Bypasses Netlify Functions and works directly with Firebase
 * Handles emulator data directly
 */
export class DirectFirebaseService {
  
  /**
   * Process emulator heartbeat directly to Firebase
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
      
      const timestamp = new Date().toISOString();
      const now = Date.now();
      
      // 1. Create or update machine record
      await this.ensureMachineExists(machineId, iotNumber, timestamp);
      
      // 2. Update heartbeat in the format system expects
      await set(ref(database, `heartbeat/${machineId}`), {
        status: 'online',
        lastSeen: now,
        timestamp: timestamp,
        machineId: machineId,
        iotNumber: iotNumber,
        ...deviceData
      });
      
      // 3. Update machine connection info
      await update(ref(database, `machines/${machineId}/connectionInfo`), {
        status: 'online',
        lastHeartbeat: timestamp
      });
      
      // 4. Update device status if provided
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
   * Ensure machine exists in Firebase - DISABLED
   * Machines must be created manually through the admin interface
   */
  private static async ensureMachineExists(machineId: string, iotNumber: string, timestamp: string): Promise<void> {
    // DISABLED: Automatic machine creation is not allowed
    // Machines must be created manually through the admin interface
    console.log(`⚠️ Machine creation disabled: ${machineId} - Please create machine manually`);
    throw new Error(`Machine ${machineId} does not exist. Please create the machine manually through the admin interface.`);
  }
  
  /**
   * Process emulator telemetry directly to Firebase
   */
  static async processEmulatorTelemetry(
    machineId: string,
    iotNumber: string,
    telemetryData: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Emülatör telemetri işleniyor: Makine ${machineId}`);
      
      const timestamp = new Date().toISOString();
      
      // Ensure machine exists
      await this.ensureMachineExists(machineId, iotNumber, timestamp);
      
      // Add telemetry data
      const telemetryRef = ref(database, `machines/${machineId}/telemetry/${Date.now()}`);
      await set(telemetryRef, {
        timestamp: timestamp,
        powerStatus: telemetryData.powerStatus || true,
        doorStatus: telemetryData.doorStatus || false,
        errors: telemetryData.errors || [],
        slotStatus: telemetryData.slotStatus || {},
        systemInfo: telemetryData.systemInfo || {
          uptime: 0,
          memoryUsage: 0,
          diskSpace: 0
        },
        temperatureReadings: telemetryData.temperatureReadings || {
          internalTemperature: -15,
          ambientTemperature: 20,
          refrigerationTemperature: -18,
          compressorStatus: 'on',
          temperatureZone: 'main'
        },
        salesData: telemetryData.salesData || {
          todaySales: 0,
          todayTransactions: 0,
          weeklySales: 0,
          monthlySales: 0
        },
        cleaningStatus: telemetryData.cleaningStatus || {
          isInCleaningMode: false,
          lastCleaningTimestamp: timestamp,
          daysSinceLastCleaning: 0
        }
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
  
  /**
   * Test connection to Firebase
   */
  static async testConnection(): Promise<boolean> {
    try {
      const testRef = ref(database, 'test');
      await set(testRef, { timestamp: new Date().toISOString() });
      await set(testRef, null); // Clean up
      console.log('✅ Firebase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  }
}

export default DirectFirebaseService;
