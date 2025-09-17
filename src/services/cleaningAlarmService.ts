import { database } from '../config/firebase';
import { ref, push, set, get } from 'firebase/database';
import { MachineService } from './machineService';
import { Alarm } from '../types';

/**
 * Cleaning Alarm Service
 * Manages cleaning-related alarms for machines
 */
export class CleaningAlarmService {
  
  /**
   * Create a cleaning alarm for a machine
   * @param machineId - Machine ID
   * @param cleaningType - Type of cleaning required
   * @param daysSinceLastCleaning - Days since last cleaning
   * @param severity - Alarm severity
   */
  static async createCleaningAlarm(
    machineId: string,
    cleaningType: 'routine' | 'deep' | 'emergency' | 'overdue',
    daysSinceLastCleaning: number,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    try {
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
      }

      const machineName = `${machine.name} (${machine.serialNumber})`;
      
      // Determine alarm message based on cleaning type
      let message = '';
      let code = '';
      
      switch (cleaningType) {
        case 'routine':
          message = `Makine rutin temizlik gerektiriyor (${daysSinceLastCleaning} gün önce temizlendi)`;
          code = 'CLEANING_ROUTINE';
          break;
        case 'deep':
          message = `Makine derinlemesine temizlik gerektiriyor (${daysSinceLastCleaning} gün önce temizlendi)`;
          code = 'CLEANING_DEEP';
          break;
        case 'emergency':
          message = `Makine acil temizlik gerektiriyor (${daysSinceLastCleaning} gün önce temizlendi)`;
          code = 'CLEANING_EMERGENCY';
          break;
        case 'overdue':
          message = `Makine temizlik süresi aştı (${daysSinceLastCleaning} gün önce temizlendi)`;
          code = 'CLEANING_OVERDUE';
          break;
      }

      // Check if similar cleaning alarm already exists
      const existingAlarmId = await this.findSimilarCleaningAlarm(machineId, cleaningType);
      if (existingAlarmId) {
        console.log(`⚠️ Similar cleaning alarm already exists: ${existingAlarmId}. Skipping duplicate creation.`);
        return existingAlarmId;
      }

      const alarmData: Omit<Alarm, 'id'> = {
        machineId: machineId,
        type: 'cleaning',
        code: code,
        message: message,
        severity: severity,
        status: 'active',
        timestamp: new Date().toISOString(),
        metadata: {
          cleaningType: cleaningType,
          daysSinceLastCleaning: daysSinceLastCleaning,
          machineType: machine.type,
          location: machine.location.address
        }
      };

      const alarmsRef = ref(database, 'alarms');
      const newAlarmRef = push(alarmsRef);
      const alarmId = newAlarmRef.key!;

      await set(newAlarmRef, {
        ...alarmData,
        id: alarmId
      });

      console.log(`🧹 Cleaning alarm created: ${alarmId} for machine ${machineName}`);
      
      return alarmId;
      
    } catch (error) {
      console.error('❌ Error creating cleaning alarm:', error);
      throw error;
    }
  }

  /**
   * Check if a machine needs cleaning and create appropriate alarms
   * @param machineId - Machine ID
   */
  static async checkCleaningRequirements(machineId: string): Promise<void> {
    try {
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        console.warn(`⚠️ Machine ${machineId} not found for cleaning check`);
        return;
      }

      // Get last cleaning date
      const lastCleaningDate = await this.getLastCleaningDate(machineId);
      const daysSinceLastCleaning = lastCleaningDate ? 
        Math.floor((Date.now() - new Date(lastCleaningDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;

      // Determine cleaning requirements based on machine type
      let cleaningThresholds = {
        routine: 7,    // 7 days
        deep: 14,      // 14 days
        emergency: 21, // 21 days
        overdue: 30    // 30 days
      };

      // Adjust thresholds based on machine type
      switch (machine.type) {
        case 'ice_cream':
          cleaningThresholds = { routine: 3, deep: 7, emergency: 10, overdue: 14 };
          break;
        case 'coffee':
          cleaningThresholds = { routine: 5, deep: 10, emergency: 15, overdue: 21 };
          break;
        case 'snack':
          cleaningThresholds = { routine: 7, deep: 14, emergency: 21, overdue: 30 };
          break;
        case 'perfume':
          cleaningThresholds = { routine: 10, deep: 20, emergency: 30, overdue: 45 };
          break;
      }

      // Create appropriate alarms
      if (daysSinceLastCleaning >= cleaningThresholds.overdue) {
        await this.createCleaningAlarm(machineId, 'overdue', daysSinceLastCleaning, 'critical');
      } else if (daysSinceLastCleaning >= cleaningThresholds.emergency) {
        await this.createCleaningAlarm(machineId, 'emergency', daysSinceLastCleaning, 'high');
      } else if (daysSinceLastCleaning >= cleaningThresholds.deep) {
        await this.createCleaningAlarm(machineId, 'deep', daysSinceLastCleaning, 'medium');
      } else if (daysSinceLastCleaning >= cleaningThresholds.routine) {
        await this.createCleaningAlarm(machineId, 'routine', daysSinceLastCleaning, 'low');
      }

    } catch (error) {
      console.error(`❌ Error checking cleaning requirements for machine ${machineId}:`, error);
    }
  }

  /**
   * Get the last cleaning date for a machine
   * @param machineId - Machine ID
   */
  private static async getLastCleaningDate(machineId: string): Promise<string | null> {
    try {
      const cleaningLogsRef = ref(database, `cleaningLogs/${machineId}`);
      const snapshot = await get(cleaningLogsRef);
      
      if (snapshot.exists()) {
        const logs = snapshot.val();
        const logEntries = Object.values(logs) as any[];
        
        if (logEntries.length > 0) {
          // Sort by timestamp and get the most recent
          logEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return logEntries[0].timestamp;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting last cleaning date for machine ${machineId}:`, error);
      return null;
    }
  }

  /**
   * Find similar active cleaning alarm
   * @param machineId - Machine ID
   * @param cleaningType - Cleaning type
   */
  private static async findSimilarCleaningAlarm(machineId: string, cleaningType: string): Promise<string | null> {
    try {
      const alarmsRef = ref(database, 'alarms');
      const snapshot = await get(alarmsRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const alarms = snapshot.val();
      
      // Look for active cleaning alarms with same machineId and cleaningType
      for (const [alarmId, alarm] of Object.entries(alarms)) {
        const alarmData = alarm as Alarm;
        if (
          alarmData.machineId === machineId &&
          alarmData.type === 'cleaning' &&
          alarmData.status === 'active' &&
          alarmData.metadata?.cleaningType === cleaningType
        ) {
          return alarmId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for similar cleaning alarms:', error);
      return null;
    }
  }

  /**
   * Resolve cleaning alarm when cleaning is completed
   * @param alarmId - Alarm ID
   * @param cleaningNotes - Optional cleaning notes
   */
  static async resolveCleaningAlarm(alarmId: string, cleaningNotes?: string): Promise<void> {
    try {
      const alarmRef = ref(database, `alarms/${alarmId}`);
      await set(alarmRef, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        metadata: {
          ...(await get(alarmRef)).val()?.metadata,
          cleaningNotes: cleaningNotes,
          resolvedBy: 'system'
        }
      });

      console.log(`✅ Cleaning alarm resolved: ${alarmId}`);
      
    } catch (error) {
      console.error(`❌ Error resolving cleaning alarm ${alarmId}:`, error);
      throw error;
    }
  }

  /**
   * Get cleaning statistics for all machines
   */
  static async getCleaningStatistics(): Promise<{
    totalMachines: number;
    machinesNeedingCleaning: number;
    overdueCleanings: number;
    averageDaysSinceCleaning: number;
  }> {
    try {
      const machines = await MachineService.getAllMachines();
      let machinesNeedingCleaning = 0;
      let overdueCleanings = 0;
      let totalDaysSinceCleaning = 0;

      for (const machine of machines) {
        const lastCleaningDate = await this.getLastCleaningDate(machine.id);
        const daysSinceLastCleaning = lastCleaningDate ? 
          Math.floor((Date.now() - new Date(lastCleaningDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;

        totalDaysSinceCleaning += daysSinceLastCleaning;

        if (daysSinceLastCleaning >= 7) {
          machinesNeedingCleaning++;
        }

        if (daysSinceLastCleaning >= 30) {
          overdueCleanings++;
        }
      }

      return {
        totalMachines: machines.length,
        machinesNeedingCleaning,
        overdueCleanings,
        averageDaysSinceCleaning: machines.length > 0 ? Math.round(totalDaysSinceCleaning / machines.length) : 0
      };

    } catch (error) {
      console.error('❌ Error getting cleaning statistics:', error);
      return {
        totalMachines: 0,
        machinesNeedingCleaning: 0,
        overdueCleanings: 0,
        averageDaysSinceCleaning: 0
      };
    }
  }
}

export default CleaningAlarmService;
