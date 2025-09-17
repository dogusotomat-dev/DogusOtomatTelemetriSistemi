import { database } from '../config/firebase';
import { ref, push, set, get, query, orderByChild, limitToLast } from 'firebase/database';
import { CleaningLog, Machine } from '../types';
import { MachineService } from './machineService';

/**
 * Cleaning Log Service
 * Manages cleaning logs for all machine types
 * Special focus on ice cream and coffee machines
 */
export class CleaningLogService {
  
  /**
   * Create a new cleaning log (when cleaning mode is activated)
   */
  static async createCleaningLog(machineId: string): Promise<string> {
    try {
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
      }

      const machineName = `${machine.name} (${machine.serialNumber})`;
      
      const cleaningLog: Omit<CleaningLog, 'id'> = {
        machineId: machineId,
        timestamp: new Date().toISOString(),
        machineType: machine.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      const cleaningLogsRef = ref(database, `cleaningLogs/${machineId}`);
      const newLogRef = push(cleaningLogsRef);
      const logId = newLogRef.key!;
      
      await set(newLogRef, {
        ...cleaningLog,
        id: logId
      });

      console.log(`🧹 Cleaning log created for ${machineName}: Cleaning mode activated`);
      
      return logId;
    } catch (error) {
      console.error('Error creating cleaning log:', error);
      throw error;
    }
  }

  /**
   * Get cleaning logs for a specific machine
   */
  static async getCleaningLogs(machineId: string, limit: number = 50): Promise<CleaningLog[]> {
    try {
      const cleaningLogsRef = query(
        ref(database, `cleaningLogs/${machineId}`),
        orderByChild('timestamp'),
        limitToLast(limit)
      );
      
      const snapshot = await get(cleaningLogsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const logs = snapshot.val();
      return Object.values(logs) as CleaningLog[];
    } catch (error) {
      console.error('Error fetching cleaning logs:', error);
      throw error;
    }
  }

  /**
   * Get all cleaning logs across all machines
   */
  static async getAllCleaningLogs(limit: number = 100): Promise<CleaningLog[]> {
    try {
      const cleaningLogsRef = ref(database, 'cleaningLogs');
      const snapshot = await get(cleaningLogsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const allLogs: CleaningLog[] = [];
      const logsData = snapshot.val();
      
      for (const machineId in logsData) {
        const machineLogs = logsData[machineId];
        for (const logId in machineLogs) {
          allLogs.push(machineLogs[logId]);
        }
      }
      
      // Sort by timestamp (most recent first)
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return allLogs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching all cleaning logs:', error);
      throw error;
    }
  }

  /**
   * Get cleaning statistics for a machine
   */
  static async getCleaningStatistics(machineId: string): Promise<{
    totalCleanings: number;
    lastCleaningDate: string | null;
    daysSinceLastCleaning: number;
  }> {
    try {
      const logs = await this.getCleaningLogs(machineId, 100);
      
      if (logs.length === 0) {
        return {
          totalCleanings: 0,
          lastCleaningDate: null,
          daysSinceLastCleaning: 999
        };
      }

      // Calculate statistics
      const totalCleanings = logs.length;
      
      // Most recent cleaning
      const lastCleaning = logs.reduce((latest, log) => 
        new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
      );
      
      const lastCleaningDate = lastCleaning.timestamp;
      const daysSinceLastCleaning = Math.floor(
        (Date.now() - new Date(lastCleaningDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        totalCleanings,
        lastCleaningDate,
        daysSinceLastCleaning
      };
    } catch (error) {
      console.error('Error calculating cleaning statistics:', error);
      throw error;
    }
  }

  /**
   * Get machines that need cleaning
   */
  static async getMachinesNeedingCleaning(): Promise<Array<{
    machine: Machine;
    daysSinceLastCleaning: number;
    cleaningType: 'ice_cream' | 'coffee' | 'snack' | 'perfume';
    priority: 'high' | 'medium' | 'low';
  }>> {
    try {
      const machines = await MachineService.getAllMachines();
      const machinesNeedingCleaning: Array<{
        machine: Machine;
        daysSinceLastCleaning: number;
        cleaningType: 'ice_cream' | 'coffee' | 'snack' | 'perfume';
        priority: 'high' | 'medium' | 'low';
      }> = [];

      for (const machine of machines) {
        const stats = await this.getCleaningStatistics(machine.id);
        
        if (stats.daysSinceLastCleaning > 0) {
          let priority: 'high' | 'medium' | 'low' = 'low';
          
          // Determine priority based on machine type and days since cleaning
          if (machine.type === 'ice_cream' && stats.daysSinceLastCleaning >= 7) {
            priority = 'high';
          } else if (machine.type === 'coffee' && stats.daysSinceLastCleaning >= 7) {
            priority = 'high';
          } else if (machine.type === 'ice_cream' && stats.daysSinceLastCleaning >= 5) {
            priority = 'medium';
          } else if (machine.type === 'coffee' && stats.daysSinceLastCleaning >= 2) {
            priority = 'medium';
          }
          
          machinesNeedingCleaning.push({
            machine,
            daysSinceLastCleaning: stats.daysSinceLastCleaning,
            cleaningType: machine.type,
            priority
          });
        }
      }

      // Sort by priority and days since last cleaning
      machinesNeedingCleaning.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.daysSinceLastCleaning - a.daysSinceLastCleaning;
      });

      return machinesNeedingCleaning;
    } catch (error) {
      console.error('Error getting machines needing cleaning:', error);
      throw error;
    }
  }
}

// Development helper functions
if (process.env.NODE_ENV === 'development') {
  (window as any).CleaningLogService = {
    async createLog(machineId: string) {
      return await CleaningLogService.createCleaningLog(machineId);
    },
    
    async getLogs(machineId: string) {
      return await CleaningLogService.getCleaningLogs(machineId);
    },
    
    async getStatistics(machineId: string) {
      return await CleaningLogService.getCleaningStatistics(machineId);
    },
    
    async getMachinesNeedingCleaning() {
      return await CleaningLogService.getMachinesNeedingCleaning();
    }
  };
  
  console.log('\n🔧 Cleaning Log Service loaded!');
  console.log('Available commands in browser console:');
  console.log('- CleaningLogService.createLog("machineId")');
  console.log('- CleaningLogService.getLogs("machineId")');
  console.log('- CleaningLogService.getStatistics("machineId")');
  console.log('- CleaningLogService.getMachinesNeedingCleaning()\n');
}

export default CleaningLogService;