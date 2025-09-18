import { database } from '../config/firebase';
import { ref, push, set, get, onValue, off, update } from 'firebase/database';
import { Machine, TelemetryData, Alarm } from '../types';
import { IntegratedEmailService } from './productionEmailService';

export class MachineService {
  // Makine ekleme
  static async addMachine(machineData: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const machinesRef = ref(database, 'machines');
      const newMachineRef = push(machinesRef);
      const machineId = newMachineRef.key!;
      
      const machine: Machine = {
        ...machineData,
        id: machineId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        connectionInfo: {
          ...machineData.connectionInfo,
          status: 'offline', // Yeni makine offline olarak başlar
          lastHeartbeat: new Date().toISOString()
        },
        configuration: {
          ...machineData.configuration,
          notifications: {
            emailAddresses: [],
            enableOfflineAlerts: true,
            enableErrorAlerts: true,
            alertThresholdMinutes: 2
          }
        }
      };
      
      await set(newMachineRef, machine);
      
      // Heartbeat izleme için kayıt oluştur
      await this.initializeMachineHeartbeat(machineId);
      
      console.log(`✅ Makine başarıyla eklendi: ${machine.name} (${machine.serialNumber})`);
      return machineId;
    } catch (error) {
      console.error('Error adding machine:', error);
      throw new Error(`Failed to add machine: ${error}`);
    }
  }

  // Makine güncelleme
  static async updateMachine(machineId: string, updates: Partial<Machine>): Promise<void> {
    try {
      const machineRef = ref(database, `machines/${machineId}`);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(machineRef, updateData);
      
      // Get machine name for logging
      const updatedMachine = await this.getMachine(machineId);
      const machineName = updatedMachine ? `${updatedMachine.name} (${updatedMachine.serialNumber})` : machineId;
      
      console.log(`✅ Makine başarıyla güncellendi: ${machineName}`);
    } catch (error) {
      console.error('Error updating machine:', error);
      throw new Error(`Failed to update machine: ${error}`);
    }
  }

  // Tüm makineleri getir
  static async getAllMachines(): Promise<Machine[]> {
    try {
      const machinesRef = ref(database, 'machines');
      const snapshot = await get(machinesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const machinesData = snapshot.val();
      return Object.values(machinesData) as Machine[];
    } catch (error) {
      console.error('Error fetching machines:', error);
      throw new Error(`Failed to fetch machines: ${error}`);
    }
  }

  // Tek makine getir
  static async getMachine(machineId: string): Promise<Machine | null> {
    try {
      const machineRef = ref(database, `machines/${machineId}`);
      const snapshot = await get(machineRef);
      
      return snapshot.exists() ? snapshot.val() as Machine : null;
    } catch (error) {
      console.error('Error fetching machine:', error);
      
      // If permission denied, return null instead of throwing
      if (error instanceof Error && error.message.includes('Permission denied')) {
        console.log('⚠️ Makine erişimi için izin reddedildi, null döndürülüyor');
        return null;
      }
      
      throw new Error(`Failed to fetch machine: ${error}`);
    }
  }

  // IoT numarası ile makine bulma
  static async getMachineByIoTNumber(iotNumber: string): Promise<Machine | null> {
    try {
      const machinesRef = ref(database, 'machines');
      const snapshot = await get(machinesRef);
      
      if (snapshot.exists()) {
        const machines: Record<string, Machine> = snapshot.val();
        
        // IoT numarasına göre makine ara
        for (const [machineId, machine] of Object.entries(machines)) {
          if (machine.iotNumber === iotNumber) {
            return { ...machine, id: machineId };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding machine by IoT number:', error);
      throw new Error(`Failed to find machine: ${error}`);
    }
  }

  // Makine silme
  static async deleteMachine(machineId: string): Promise<void> {
    try {
      // Get machine name before deletion for logging
      const machine = await this.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      
      const machineRef = ref(database, `machines/${machineId}`);
      await set(machineRef, null);
      
      // Heartbeat kaydını da sil
      const heartbeatRef = ref(database, `heartbeat/${machineId}`);
      await set(heartbeatRef, null);
      
      console.log(`✅ Makine başarıyla silindi: ${machineName}`);
    } catch (error) {
      console.error('Error deleting machine:', error);
      throw new Error(`Failed to delete machine: ${error}`);
    }
  }

  // Heartbeat izleme sistemi başlatma
  static async initializeMachineHeartbeat(machineId: string): Promise<void> {
    try {
      const heartbeatRef = ref(database, `heartbeat/${machineId}`);
      await set(heartbeatRef, {
        lastSeen: Date.now(), // Use Date.now() instead of serverTimestamp() for consistency
        status: 'offline',
        machineId: machineId
      });
    } catch (error) {
      console.error('Error initializing heartbeat:', error);
      throw error;
    }
  }

  // Makine heartbeat güncelleme (IoT cihazları tarafından çağrılır)
  static async updateHeartbeat(machineId: string, deviceData?: {
    batteryLevel?: number;
    signalStrength?: number;
    temperature?: number;
    lastError?: string;
  }): Promise<void> {
    try {
      const now = Date.now();
      
      // Get machine details for proper logging
      const machine = await this.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      
      const heartbeatRef = ref(database, `heartbeat/${machineId}`);
      await update(heartbeatRef, {
        lastSeen: now, // Use consistent timestamp format
        status: 'online'
      });
      
      // Makine durumunu da güncelle
      const machineRef = ref(database, `machines/${machineId}/connectionInfo`);
      await update(machineRef, {
        status: 'online',
        lastHeartbeat: new Date(now).toISOString() // Convert to ISO string for machine record
      });

      // Update device-specific data if provided
      if (deviceData) {
        const deviceStatusRef = ref(database, `machines/${machineId}/deviceStatus`);
        await update(deviceStatusRef, {
          ...deviceData,
          lastUpdated: new Date().toISOString()
        });
      }
      
      console.log(`✅ Makine için heartbeat güncellendi: ${machineName} - ${new Date(now).toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ Error updating heartbeat:', error);
      throw error;
    }
  }

  // Telemetry data ekleme
  static async addTelemetryData(machineId: string, telemetryData: TelemetryData): Promise<void> {
    try {
      const telemetryRef = ref(database, `machines/${machineId}/telemetry`);
      const newTelemetryRef = push(telemetryRef);
      
      await set(newTelemetryRef, {
        ...telemetryData,
        timestamp: new Date().toISOString()
      });
      
      // Heartbeat güncelle
      await this.updateHeartbeat(machineId);
      
      // Error processing removed - no automatic alarms
      
    } catch (error) {
      console.error('Error adding telemetry data:', error);
      throw error;
    }
  }

  // processErrors function removed - no automatic alarm creation

  // Alarm oluşturma
  static async createAlarm(alarmData: Omit<Alarm, 'id'>): Promise<string> {
    try {
      // Check if a similar active alarm already exists to prevent duplicates
      const existingAlarmId = await this.findSimilarActiveAlarm(
        alarmData.machineId, 
        alarmData.type, 
        alarmData.code
      );
      
      if (existingAlarmId) {
        console.log(`⚠️ Similar active alarm already exists: ${existingAlarmId}. Skipping duplicate creation.`);
        return existingAlarmId; // Return existing alarm ID instead of creating duplicate
      }
      
      const alarmsRef = ref(database, 'alarms');
      const newAlarmRef = push(alarmsRef);
      const alarmId = newAlarmRef.key!;
      
      const alarm: Alarm = {
        ...alarmData,
        id: alarmId
      };
      
      await set(newAlarmRef, alarm);
      
      // Get machine details for logging
      const machine = await this.getMachine(alarmData.machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : alarmData.machineId;
      
      console.log(`⚠️ Alarm oluşturuldu: ${alarmId} - Makine: ${machineName}`);
      
      // Send email notification using integrated email service
      if (alarm.severity === 'high' || alarm.severity === 'critical') {
        try {
          console.log(`📧 Attempting to send email notification for ${alarm.type} alarm (severity: ${alarm.severity})`);
          
          const alertType = alarm.type === 'offline' ? 'offline' : 'error';
          const customMessage = `${alarm.code}: ${alarm.message}`;
          
          const emailSent = await IntegratedEmailService.sendMachineAlert(alarm.machineId, alertType, customMessage);
          
          if (emailSent) {
            console.log(`📧 Alarm için email bildirimi başarıyla gönderildi: ${alarmId} (${machineName})`);
          } else {
            console.log(`⚠️ Email bildirimi işlendi ancak makine için alıcı yapılandırılmamış: ${machineName}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send email notification:', emailError);
          // Don't throw error here - alarm creation should succeed even if email fails
        }
      } else {
        console.log(`📧 Email notification skipped for ${alarm.type} alarm (severity: ${alarm.severity} - only high/critical trigger emails)`);
      }
      
      return alarmId;
    } catch (error) {
      console.error('Error creating alarm:', error);
      throw error;
    }
  }

  /**
   * Check if a similar active alarm already exists to prevent duplicates
   * @param machineId - The machine ID
   * @param type - The alarm type (offline, error, etc.)
   * @param code - The alarm code
   * @returns The existing alarm ID if found, null otherwise
   */
  static async findSimilarActiveAlarm(machineId: string, type: string, code: string): Promise<string | null> {
    try {
      const alarmsRef = ref(database, 'alarms');
      const snapshot = await get(alarmsRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const alarms = snapshot.val();
      
      // Look for active alarms with same machineId, type, and code
      for (const [alarmId, alarm] of Object.entries(alarms)) {
        const alarmData = alarm as Alarm;
        if (
          alarmData.machineId === machineId &&
          alarmData.type === type &&
          alarmData.code === code &&
          alarmData.status === 'active'
        ) {
          return alarmId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for similar alarms:', error);
      return null; // If there's an error, we'll create the alarm to be safe
    }
  }

  // Legacy triggerAlarmNotification method removed - replaced by IntegratedEmailService
  // This method was causing Firebase permission errors and is no longer needed

  // determineSeverity function removed - no automatic alarm creation

  // Makine durumlarını real-time izleme
  static subscribeToMachineStatus(
    callback: (machines: { [key: string]: { status: string; lastSeen: number } }) => void
  ): () => void {
    const heartbeatRef = ref(database, 'heartbeat');
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes (consistent with RealIoTMonitoringService)
    
    const unsubscribe = onValue(heartbeatRef, (snapshot) => {
      if (snapshot.exists()) {
        const heartbeatData = snapshot.val();
        const now = Date.now();
        
        // Process and validate the heartbeat data
        const processedData: { [key: string]: { status: string; lastSeen: number } } = {};
        
        for (const [machineId, data] of Object.entries(heartbeatData)) {
          const machineData = data as any;
          
          // Ensure lastSeen is a valid number
          let lastSeen = machineData.lastSeen;
          if (typeof lastSeen !== 'number') {
            lastSeen = Date.now(); // Fallback to current time
          }
          
          // Determine actual status based on heartbeat timing
          const timeSinceLastHeartbeat = now - lastSeen;
          const isActuallyOffline = timeSinceLastHeartbeat > OFFLINE_THRESHOLD;
          
          // If machine is actually offline, mark it as offline regardless of stored status
          const actualStatus = isActuallyOffline ? 'offline' : (machineData.status || 'offline');
          
          processedData[machineId] = {
            status: actualStatus,
            lastSeen: lastSeen
          };
        }
        
        callback(processedData);
      } else {
        callback({});
      }
    });
    
    return () => off(heartbeatRef, 'value', unsubscribe);
  }

  // checkOfflineMachines function removed - no automatic offline monitoring

  // Makineyi offline olarak işaretle
  static async markMachineOffline(machineId: string): Promise<void> {
    try {
      // Get machine details for proper logging
      const machine = await this.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      
      // Heartbeat güncelle
      const heartbeatRef = ref(database, `heartbeat/${machineId}`);
      await update(heartbeatRef, {
        status: 'offline'
        // Don't update lastSeen when marking offline - keep the last actual heartbeat time
      });
      
      // Makine durumunu güncelle
      const machineRef = ref(database, `machines/${machineId}/connectionInfo`);
      await update(machineRef, {
        status: 'offline'
      });
      
      console.log(`❌ Makine offline olarak işaretlendi: ${machineName}`);
    } catch (error) {
      console.error('Error marking machine offline:', error);
      throw error;
    }
  }
}

// Development helper functions
if (process.env.NODE_ENV === 'development') {
  (window as any).DebugMachineService = {
    async checkMachineStatus() {
      try {
        const heartbeatRef = ref(database, 'heartbeat');
        const snapshot = await get(heartbeatRef);
        
        if (!snapshot.exists()) {
          console.log('📊 No heartbeat data found');
          return;
        }
        
        const heartbeatData = snapshot.val();
        const now = Date.now();
        const offlineThreshold = 2 * 60 * 1000;
        
        console.log('=== MACHINE STATUS DEBUG ===');
        
        for (const [machineId, data] of Object.entries(heartbeatData)) {
          const machineData = data as { lastSeen: number; status: string };
          const machine = await MachineService.getMachine(machineId);
          const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
          
          const timeDiff = now - machineData.lastSeen;
          const timeDiffMinutes = Math.floor(timeDiff / 60000);
          
          console.log(`🔍 ${machineName}:`);
          console.log(`  Durum: ${machineData.status}`);
          console.log(`  Son görülme: ${timeDiffMinutes}d ${Math.floor((timeDiff % 60000) / 1000)}s önce`);
          console.log(`  Email uyarıları: offline=${machine?.configuration.notifications?.enableOfflineAlerts}, error=${machine?.configuration.notifications?.enableErrorAlerts}`);
          console.log(`  Email adresleri: ${machine?.configuration.notifications?.emailAddresses?.join(', ') || 'Yok'}`);
          console.log(`  Eşik aşıldı: ${timeDiff > offlineThreshold}`);
        }
        
        console.log('=== END DEBUG ===');
      } catch (error) {
        console.error('Error in debug function:', error);
      }
    },
    
    // forceOfflineCheck removed - no automatic offline monitoring
    
    async testEmailForMachine(machineId: string) {
      try {
        const success = await IntegratedEmailService.sendMachineAlert(machineId, 'offline', 'Manual test email from debug console');
        console.log(success ? '✅ Test email sent' : '⚠️ No email sent (check configuration)');
      } catch (error) {
        console.error('❌ Test email failed:', error);
      }
    }
  };
  
  console.log('🔧 Debug araçları yüklendi! Mevcut komutlar:');
  console.log('- DebugMachineService.checkMachineStatus() - Tüm makine durumlarını kontrol et');
  console.log('- DebugMachineService.forceOfflineCheck() - Offline algılama kontrolünü zorla');
  console.log('- DebugMachineService.testEmailForMachine("machineId") - Belirli makine için email test et');
}

// OfflineMonitoringService removed - no automatic monitoring