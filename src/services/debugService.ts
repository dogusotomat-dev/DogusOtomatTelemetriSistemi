import { database } from '../config/firebase';
import { ref, get } from 'firebase/database';
import { MachineService } from './machineService';

/**
 * Debug Service for troubleshooting machine online status issues
 */
export class DebugService {
  
  /**
   * Check current heartbeat data and machine status
   */
  static async checkMachineStatus(): Promise<void> {
    try {
      console.log('🔍 Starting machine status debug...');
      
      // Get all machines
      const machines = await MachineService.getAllMachines();
      console.log(`📊 Found ${machines.length} machines in database`);
      
      // Get heartbeat data
      const heartbeatRef = ref(database, 'heartbeat');
      const heartbeatSnapshot = await get(heartbeatRef);
      
      if (!heartbeatSnapshot.exists()) {
        console.log('❌ No heartbeat data found in Firebase');
        return;
      }
      
      const heartbeatData = heartbeatSnapshot.val();
      const now = Date.now();
      const offlineThreshold = 5 * 60 * 1000; // 5 minutes
      
      console.log('=== MACHINE STATUS DEBUG ===');
      console.log(`Current time: ${new Date(now).toLocaleString()}`);
      console.log(`Offline threshold: ${offlineThreshold / 1000 / 60} minutes`);
      console.log('');
      
      for (const [machineId, data] of Object.entries(heartbeatData)) {
        const machineData = data as { lastSeen: number; status: string; machineId?: string; iotNumber?: string };
        const machine = machines.find(m => m.id === machineId);
        const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
        
        const timeDiff = now - machineData.lastSeen;
        const timeDiffMinutes = Math.floor(timeDiff / 60000);
        const timeDiffSeconds = Math.floor((timeDiff % 60000) / 1000);
        const isOffline = timeDiff > offlineThreshold;
        
        console.log(`🔍 ${machineName}:`);
        console.log(`  Machine ID: ${machineId}`);
        console.log(`  IoT Number: ${machineData.iotNumber || 'N/A'}`);
        console.log(`  Status: ${machineData.status}`);
        console.log(`  Last seen: ${timeDiffMinutes}m ${timeDiffSeconds}s ago`);
        console.log(`  Is offline: ${isOffline ? '❌ YES' : '✅ NO'}`);
        console.log(`  Last seen timestamp: ${new Date(machineData.lastSeen).toLocaleString()}`);
        console.log('');
      }
      
      console.log('=== END DEBUG ===');
      
    } catch (error) {
      console.error('❌ Error in debug function:', error);
    }
  }
  
  /**
   * Force update heartbeat for a specific machine
   */
  static async forceHeartbeatUpdate(machineId: string): Promise<void> {
    try {
      console.log(`🔄 Force updating heartbeat for machine: ${machineId}`);
      
      // Update heartbeat
      await MachineService.updateHeartbeat(machineId, {
        batteryLevel: 85,
        signalStrength: 90,
        temperature: -15
      });
      
      console.log(`✅ Heartbeat force updated for machine: ${machineId}`);
      
    } catch (error) {
      console.error('❌ Error force updating heartbeat:', error);
    }
  }
  
  /**
   * Check if machine exists in Firebase
   */
  static async checkMachineExists(machineId: string): Promise<boolean> {
    try {
      const machine = await MachineService.getMachine(machineId);
      const exists = !!machine;
      
      console.log(`🔍 Machine ${machineId} exists: ${exists ? '✅ YES' : '❌ NO'}`);
      
      if (machine) {
        console.log(`  Name: ${machine.name}`);
        console.log(`  Serial: ${machine.serialNumber}`);
        console.log(`  Type: ${machine.type}`);
        console.log(`  IoT Number: ${machine.iotNumber}`);
        console.log(`  ID: ${machine.id}`);
      }
      
      return exists;
      
    } catch (error) {
      console.error('❌ Error checking machine existence:', error);
      return false;
    }
  }
  
  /**
   * Clean up test data and recreate machine
   */
  static async recreateTestMachine(machineId: string): Promise<void> {
    try {
      console.log(`🧹 Cleaning up and recreating machine: ${machineId}`);
      
      // Remove existing machine and heartbeat data
      const { ref, remove } = await import('firebase/database');
      await remove(ref(database, `machines/${machineId}`));
      await remove(ref(database, `heartbeat/${machineId}`));
      
      console.log(`✅ Cleaned up existing data for machine: ${machineId}`);
      
      // Force heartbeat update to recreate machine
      await this.forceHeartbeatUpdate(machineId);
      
      console.log(`✅ Recreated machine: ${machineId}`);
      
    } catch (error) {
      console.error('❌ Error recreating test machine:', error);
    }
  }
}

// Make debug functions available in development
if (process.env.NODE_ENV === 'development') {
  (window as any).DebugService = DebugService;
}
