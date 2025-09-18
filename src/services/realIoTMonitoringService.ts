import { database } from '../config/firebase';
import { ref, get, onValue, off } from 'firebase/database';
import { MachineService } from './machineService';
import { CleaningAlarmService } from './cleaningAlarmService';

/**
 * Real IoT Monitoring Service
 * Monitors real IoT devices and detects offline status based on heartbeat signals
 * This service replaces the simulator-based monitoring in production environments
 */
export class RealIoTMonitoringService {
  private static DEFAULT_OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private static CRITICAL_OFFLINE_THRESHOLD = 15 * 60 * 1000; // 15 minutes
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static isMonitoring = false;

  /**
   * Start monitoring real IoT devices for offline detection
   */
  static async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Real IoT monitoring already running');
      return;
    }

    console.log('🚀 Starting real IoT device monitoring');
    this.isMonitoring = true;

    // Initial check
    await this.checkOfflineMachines();

    // Set up periodic monitoring (every 2 minutes)
    this.monitoringInterval = setInterval(async () => {
      await this.checkOfflineMachines();
      await this.checkCleaningRequirements();
    }, 2 * 60 * 1000);

    console.log('✅ Real IoT monitoring started successfully');
  }

  /**
   * Stop monitoring real IoT devices
   */
  static async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('⚠️ Real IoT monitoring not running');
      return;
    }

    console.log('⏹️ Stopping real IoT device monitoring');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('✅ Real IoT monitoring stopped');
  }

  /**
   * Check for offline machines based on heartbeat data
   */
  private static async checkOfflineMachines(): Promise<void> {
    try {
      // Get all machines first
      const machines = await MachineService.getAllMachines();
      const now = Date.now();
      const offlineMachines: string[] = [];
      const criticalOfflineMachines: string[] = [];

      // Check each machine's heartbeat
      for (const machine of machines) {
        try {
          // Get heartbeat data for this machine
          const heartbeatRef = ref(database, `heartbeat/${machine.id}`);
          const heartbeatSnapshot = await get(heartbeatRef);
          
          if (!heartbeatSnapshot.exists()) {
            // No heartbeat data - machine is offline
            console.log(`⚠️ Makine için heartbeat verisi yok: ${machine.name} (${machine.serialNumber})`);
            offlineMachines.push(machine.id);
            continue;
          }

          const heartbeatData = heartbeatSnapshot.val() as { lastSeen: number; status: string };
          
          // Skip if already marked as offline
          if (heartbeatData.status === 'offline') {
            continue;
          }

          // Validate lastSeen timestamp
          if (!heartbeatData.lastSeen || typeof heartbeatData.lastSeen !== 'number') {
            console.log(`⚠️ Makine için geçersiz heartbeat verisi: ${machine.name} (${machine.serialNumber})`);
            offlineMachines.push(machine.id);
            continue;
          }

          const timeSinceLastHeartbeat = now - heartbeatData.lastSeen;
          
          // Check if machine should be marked as offline
          if (timeSinceLastHeartbeat > this.DEFAULT_OFFLINE_THRESHOLD) {
            offlineMachines.push(machine.id);
            
            // Check if it's been offline for a critical duration
            if (timeSinceLastHeartbeat > this.CRITICAL_OFFLINE_THRESHOLD) {
              criticalOfflineMachines.push(machine.id);
            }
          }
        } catch (machineError) {
          console.error(`❌ Error checking machine ${machine.id}:`, machineError);
        }
      }

      // Process offline machines
      for (const machineId of offlineMachines) {
        await this.handleOfflineMachine(machineId, criticalOfflineMachines.includes(machineId));
      }

      if (offlineMachines.length > 0) {
        console.log(`📊 ${offlineMachines.length} offline makine bulundu (${criticalOfflineMachines.length} kritik)`);
      }

    } catch (error) {
      console.error('❌ Error checking offline machines:', error);
    }
  }

  /**
   * Handle a machine that has gone offline
   */
  private static async handleOfflineMachine(machineId: string, isCritical: boolean): Promise<void> {
    try {
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        console.warn(`⚠️ Machine ${machineId} not found, skipping offline handling`);
        return;
      }

      const machineName = `${machine.name} (${machine.serialNumber})`;
      
      // Mark machine as offline
      await MachineService.markMachineOffline(machineId);
      
      // Create offline alarm
      const alarmData = {
        machineId: machineId,
        type: 'offline' as const,
        code: isCritical ? 'CRITICAL_OFFLINE' : 'OFFLINE',
        message: isCritical 
          ? `Makine kritik süre boyunca çevrimdışı (${Math.floor((Date.now() - (await this.getLastHeartbeatTime(machineId))) / 60000)} dakika)`
          : `Makine çevrimdışı (${Math.floor((Date.now() - (await this.getLastHeartbeatTime(machineId))) / 60000)} dakika)`,
        severity: (isCritical ? 'critical' : 'high') as 'critical' | 'high',
        timestamp: new Date().toISOString(),
        status: 'active' as const
      };

      await MachineService.createAlarm(alarmData);
      
      console.log(`❌ Makine offline olarak işaretlendi: ${machineName} (${isCritical ? 'KRİTİK' : 'NORMAL'})`);
      
    } catch (error) {
      console.error(`❌ Error handling offline machine ${machineId}:`, error);
    }
  }

  /**
   * Get the last heartbeat time for a machine
   */
  private static async getLastHeartbeatTime(machineId: string): Promise<number> {
    try {
      const heartbeatRef = ref(database, `heartbeat/${machineId}`);
      const snapshot = await get(heartbeatRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val() as { lastSeen: number; status: string };
        if (data.lastSeen && typeof data.lastSeen === 'number') {
          return data.lastSeen;
        }
      }
      
      // If no heartbeat data, return a very old timestamp to indicate offline
      return Date.now() - (this.CRITICAL_OFFLINE_THRESHOLD + 60000);
    } catch (error) {
      console.error(`Error getting last heartbeat time for machine ${machineId}:`, error);
      return Date.now() - (this.CRITICAL_OFFLINE_THRESHOLD + 60000);
    }
  }

  /**
   * Get monitoring status
   */
  static getMonitoringStatus(): { isMonitoring: boolean; intervalActive: boolean } {
    return {
      isMonitoring: this.isMonitoring,
      intervalActive: this.monitoringInterval !== null
    };
  }

  /**
   * Configure offline thresholds for different machine types
   */
  static configureThresholds(config: {
    defaultThreshold?: number;
    criticalThreshold?: number;
    machineTypeThresholds?: {
      ice_cream?: number;
      snack?: number;
      coffee?: number;
      perfume?: number;
    };
  }): void {
    if (config.defaultThreshold) {
      this.DEFAULT_OFFLINE_THRESHOLD = config.defaultThreshold;
    }
    
    if (config.criticalThreshold) {
      this.CRITICAL_OFFLINE_THRESHOLD = config.criticalThreshold;
    }

    console.log('⚙️ IoT monitoring thresholds updated:', {
      defaultThreshold: `${this.DEFAULT_OFFLINE_THRESHOLD / 60000} minutes`,
      criticalThreshold: `${this.CRITICAL_OFFLINE_THRESHOLD / 60000} minutes`
    });
  }

  /**
   * Check cleaning requirements for all machines
   */
  private static async checkCleaningRequirements(): Promise<void> {
    try {
      const machines = await MachineService.getAllMachines();
      
      for (const machine of machines) {
        await CleaningAlarmService.checkCleaningRequirements(machine.id);
      }
      
    } catch (error) {
      console.error('❌ Error checking cleaning requirements:', error);
    }
  }

  /**
   * Subscribe to real-time machine status changes
   */
  static subscribeToMachineStatus(
    callback: (machines: { [key: string]: { status: string; lastSeen: number; isOffline: boolean } }) => void
  ): () => void {
    const heartbeatRef = ref(database, 'heartbeat');
    
    const unsubscribe = onValue(heartbeatRef, (snapshot) => {
      if (snapshot.exists()) {
        const heartbeatData = snapshot.val();
        const now = Date.now();
        
        const processedData: { [key: string]: { status: string; lastSeen: number; isOffline: boolean } } = {};
        
        for (const [machineId, data] of Object.entries(heartbeatData)) {
          const machineData = data as any;
          
          let lastSeen = machineData.lastSeen;
          if (typeof lastSeen !== 'number') {
            lastSeen = Date.now();
          }
          
          const timeSinceLastHeartbeat = now - lastSeen;
          const isOffline = timeSinceLastHeartbeat > this.DEFAULT_OFFLINE_THRESHOLD;
          
          processedData[machineId] = {
            status: machineData.status || 'offline',
            lastSeen: lastSeen,
            isOffline: isOffline
          };
        }
        
        callback(processedData);
      } else {
        callback({});
      }
    });
    
    return () => off(heartbeatRef, 'value', unsubscribe);
  }
}

// Development helper functions
if (process.env.NODE_ENV === 'development') {
  (window as any).RealIoTMonitoring = {
    async start() {
      await RealIoTMonitoringService.startMonitoring();
    },
    
    async stop() {
      await RealIoTMonitoringService.stopMonitoring();
    },
    
    getStatus() {
      return RealIoTMonitoringService.getMonitoringStatus();
    },
    
    configureThresholds(config: any) {
      RealIoTMonitoringService.configureThresholds(config);
    }
  };
  
  console.log('🔧 Real IoT Monitoring Service loaded!');
  console.log('Available commands in browser console:');
  console.log('- RealIoTMonitoring.start() // Start monitoring');
  console.log('- RealIoTMonitoring.stop() // Stop monitoring');
  console.log('- RealIoTMonitoring.getStatus() // Get status');
  console.log('- RealIoTMonitoring.configureThresholds({defaultThreshold: 300000}) // Configure thresholds\n');
}

export default RealIoTMonitoringService;
