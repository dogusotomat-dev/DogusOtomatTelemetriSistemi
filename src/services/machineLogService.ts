import { database } from '../config/firebase';
import { ref, push, set, get, query, orderByChild, limitToLast } from 'firebase/database';
import { Machine } from '../types';

export interface MachineLog {
  id: string;
  machineId: string;
  type: 'cleaning' | 'offline' | 'maintenance' | 'error';
  message: string;
  timestamp: string;
  machineName: string;
  machineType: string;
  createdAt: string;
}

export class MachineLogService {
  /**
   * Log cleaning mode activation
   */
  static async logCleaning(machineId: string, machine: Machine): Promise<string> {
    try {
      const machineName = `${machine.name} (${machine.serialNumber})`;
      
      const log: Omit<MachineLog, 'id'> = {
        machineId: machineId,
        type: 'cleaning',
        message: 'Temizlik modu aktif edildi',
        timestamp: new Date().toISOString(),
        machineName: machineName,
        machineType: machine.type,
        createdAt: new Date().toISOString()
      };

      const logsRef = ref(database, `machineLogs/${machineId}`);
      const newLogRef = push(logsRef);
      const logId = newLogRef.key!;
      
      await set(newLogRef, {
        ...log,
        id: logId
      });

      console.log(`🧹 Cleaning logged for ${machineName}`);
      return logId;
    } catch (error) {
      console.error('Error logging cleaning:', error);
      throw error;
    }
  }

  /**
   * Log machine offline status
   */
  static async logOffline(machineId: string, machine: Machine, daysOffline: number): Promise<string> {
    try {
      const machineName = `${machine.name} (${machine.serialNumber})`;
      
      const log: Omit<MachineLog, 'id'> = {
        machineId: machineId,
        type: 'offline',
        message: `Makine ${daysOffline} gündür offline`,
        timestamp: new Date().toISOString(),
        machineName: machineName,
        machineType: machine.type,
        createdAt: new Date().toISOString()
      };

      const logsRef = ref(database, `machineLogs/${machineId}`);
      const newLogRef = push(logsRef);
      const logId = newLogRef.key!;
      
      await set(newLogRef, {
        ...log,
        id: logId
      });

      console.log(`📴 Offline logged for ${machineName} - ${daysOffline} days`);
      return logId;
    } catch (error) {
      console.error('Error logging offline status:', error);
      throw error;
    }
  }

  /**
   * Log cleaning needed status
   */
  static async logCleaningNeeded(machineId: string, machine: Machine, daysWithoutCleaning: number): Promise<string> {
    try {
      const machineName = `${machine.name} (${machine.serialNumber})`;
      const maxDays = machine.type === 'ice_cream' ? 7 : 2;
      
      const log: Omit<MachineLog, 'id'> = {
        machineId: machineId,
        type: 'maintenance',
        message: `${machine.type === 'ice_cream' ? 'Dondurma' : 'Kahve'} otomatı ${daysWithoutCleaning} gündür temizlenmedi (max: ${maxDays} gün)`,
        timestamp: new Date().toISOString(),
        machineName: machineName,
        machineType: machine.type,
        createdAt: new Date().toISOString()
      };

      const logsRef = ref(database, `machineLogs/${machineId}`);
      const newLogRef = push(logsRef);
      const logId = newLogRef.key!;
      
      await set(newLogRef, {
        ...log,
        id: logId
      });

      console.log(`🧼 Cleaning needed logged for ${machineName} - ${daysWithoutCleaning} days`);
      return logId;
    } catch (error) {
      console.error('Error logging cleaning needed:', error);
      throw error;
    }
  }

  /**
   * Get logs for a specific machine
   */
  static async getMachineLogs(machineId: string, limit: number = 50): Promise<MachineLog[]> {
    try {
      const logsRef = query(
        ref(database, `machineLogs/${machineId}`),
        orderByChild('timestamp'),
        limitToLast(limit)
      );
      const snapshot = await get(logsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const logs = snapshot.val();
      return Object.values(logs).reverse() as MachineLog[];
    } catch (error) {
      console.error('Error getting machine logs:', error);
      return [];
    }
  }

  /**
   * Get all machine logs
   */
  static async getAllMachineLogs(limit: number = 100): Promise<MachineLog[]> {
    try {
      const allLogs: MachineLog[] = [];
      
      // Get all machine IDs
      const machineLogsRef = ref(database, 'machineLogs');
      const snapshot = await get(machineLogsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const machineLogsData = snapshot.val();
      
      // Collect logs from all machines
      for (const machineId in machineLogsData) {
        const machineLogs = Object.values(machineLogsData[machineId]) as MachineLog[];
        allLogs.push(...machineLogs);
      }
      
      // Sort by timestamp and limit
      return allLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting all machine logs:', error);
      return [];
    }
  }
}

