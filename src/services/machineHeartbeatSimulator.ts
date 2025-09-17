import { ref, update, get } from 'firebase/database';
import { database } from '../config/firebase';
import { MachineService } from './machineService';

/**
 * Machine Heartbeat Simulator
 * This service simulates IoT device heartbeat signals for testing purposes
 * In a real environment, actual IoT devices would send these signals
 * 
 * ⚠️ PRODUCTION NOTICE: This simulator should be disabled in production environments
 * Real IoT devices should send their own heartbeat signals via the MachineService.updateHeartbeat() method
 */
export class MachineHeartbeatSimulator {
  private static activeSimulations: Map<string, NodeJS.Timeout> = new Map();
  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  /**
   * Start simulating heartbeat for a specific machine
   * @param machineId - The machine ID to simulate
   * @param isOnline - Whether to simulate online or offline status
   */
  static async startSimulation(machineId: string, isOnline: boolean = true): Promise<void> {
    // ⚠️ PRODUCTION CHECK: Disable simulator in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Heartbeat simulator is disabled in production environment');
      console.warn('⚠️ Real IoT devices should send heartbeat signals via MachineService.updateHeartbeat()');
      return;
    }

    // Stop existing simulation if running
    this.stopSimulation(machineId);

    // Get machine details for proper logging
    const machine = await MachineService.getMachine(machineId);
    const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;

    if (isOnline) {
      console.log(`🟢 [DEVELOPMENT] Starting heartbeat simulation for machine: ${machineName}`);
      
      // Send initial heartbeat
      this.sendHeartbeat(machineId);
      
      // Schedule regular heartbeats
      const intervalId = setInterval(() => {
        this.sendHeartbeat(machineId);
      }, this.HEARTBEAT_INTERVAL);
      
      this.activeSimulations.set(machineId, intervalId);
    } else {
      console.log(`🔴 [DEVELOPMENT] Machine ${machineName} set to offline (no heartbeat simulation)`);
    }
  }

  /**
   * Stop simulating heartbeat for a specific machine
   * @param machineId - The machine ID to stop simulating
   */
  static async stopSimulation(machineId: string): Promise<void> {
    const intervalId = this.activeSimulations.get(machineId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSimulations.delete(machineId);
      
      // Get machine details for proper logging
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      
      console.log(`⏹️ Stopped heartbeat simulation for machine: ${machineName}`);
    }
  }

  /**
   * Stop all simulations
   */
  static async stopAllSimulations(): Promise<void> {
    console.log('⏹️ Stopping all heartbeat simulations');
    const machineIds = Array.from(this.activeSimulations.keys());
    
    for (const machineId of machineIds) {
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      
      const intervalId = this.activeSimulations.get(machineId);
      if (intervalId) {
        clearInterval(intervalId);
        console.log(`  - Stopped simulation for machine: ${machineName}`);
      }
    }
    this.activeSimulations.clear();
  }

  /**
   * Send a single heartbeat for a machine
   * @param machineId - The machine ID
   */
  static async sendHeartbeat(machineId: string): Promise<void> {
    try {
      await MachineService.updateHeartbeat(machineId);
      // Note: Machine service already logs with proper machine name
    } catch (error) {
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      console.error(`❌ Failed to send heartbeat for machine ${machineName}:`, error);
    }
  }

  /**
   * Simulate an error for a machine
   * @param machineId - The machine ID
   * @param errorCode - Error code to simulate
   * @param errorMessage - Error message
   * @param severity - Error severity
   */
  static async simulateError(
    machineId: string, 
    errorCode: string = 'TEST_ERROR', 
    errorMessage: string = 'Simulated error for testing',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const telemetryData = {
        timestamp: new Date().toISOString(),
        powerStatus: true,
        doorStatus: false,
        errors: [
          {
            code: errorCode,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            severity: severity
          }
        ],
        slotStatus: {},
        systemInfo: {
          uptime: 3600000,
          memoryUsage: 75,
          diskSpace: 85
        }
      };
      
      await MachineService.addTelemetryData(machineId, telemetryData);
      
      // Get machine details for proper logging
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      
      console.log(`🚨 Simulated error for machine ${machineName}: ${errorCode} - ${errorMessage}`);
    } catch (error) {
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      console.error(`❌ Failed to simulate error for machine ${machineName}:`, error);
    }
  }

  /**
   * Get the status of all active simulations
   */
  static getActiveSimulations(): string[] {
    return Array.from(this.activeSimulations.keys());
  }

  /**
   * Check if a machine has active simulation
   * @param machineId - The machine ID to check
   */
  static isSimulationActive(machineId: string): boolean {
    return this.activeSimulations.has(machineId);
  }

  /**
   * Start simulations for all machines
   * @param online - Whether to start them as online or offline
   */
  static async startAllMachineSimulations(online: boolean = true): Promise<void> {
    // ⚠️ PRODUCTION CHECK: Disable simulator in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Heartbeat simulator is disabled in production environment');
      console.warn('⚠️ Real IoT devices should send heartbeat signals via MachineService.updateHeartbeat()');
      return;
    }

    try {
      const machines = await MachineService.getAllMachines();
      console.log(`🚀 [DEVELOPMENT] Starting heartbeat simulations for ${machines.length} machines`);
      
      machines.forEach(machine => {
        this.startSimulation(machine.id, online);
      });
      
      console.log('✅ [DEVELOPMENT] All machine simulations started');
    } catch (error) {
      console.error('❌ Failed to start all machine simulations:', error);
    }
  }

  /**
   * Simulate a machine going offline temporarily
   * @param machineId - The machine ID
   * @param offlineDurationMs - How long to stay offline (in milliseconds)
   */
  static async simulateTemporaryOffline(machineId: string, offlineDurationMs: number = 300000): Promise<void> {
    // Get machine details for proper logging
    const machine = await MachineService.getMachine(machineId);
    const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
    
    console.log(`📴 Simulating temporary offline for machine ${machineName} for ${offlineDurationMs / 1000} seconds`);
    
    // Stop heartbeat to simulate offline
    await this.stopSimulation(machineId);
    
    // Restart heartbeat after specified duration
    setTimeout(async () => {
      console.log(`🔄 Bringing machine ${machineName} back online`);
      await this.startSimulation(machineId, true);
    }, offlineDurationMs);
  }

  /**
   * Development helper: Print simulation status
   */
  static async printSimulationStatus(): Promise<void> {
    const activeSimulations = this.getActiveSimulations();
    console.log('\n📊 Machine Heartbeat Simulation Status:');
    console.log(`Active simulations: ${activeSimulations.length}`);
    
    for (const machineId of activeSimulations) {
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
      console.log(`  🟢 ${machineName}`);
    }
    
    console.log('');
  }
}

// Development helper functions (only available in development mode)
if (process.env.NODE_ENV === 'development') {
  // Add to global scope for console debugging
  (window as any).MachineSimulator = MachineHeartbeatSimulator;
  
  // Log helper functions
  console.log('\n🔧 Machine Heartbeat Simulator loaded (DEVELOPMENT ONLY)!');
  console.log('⚠️ This simulator is DISABLED in production environments');
  console.log('Available commands in browser console:');
  console.log('- MachineSimulator.startAllMachineSimulations() // Start all machines online');
  console.log('- MachineSimulator.stopAllSimulations() // Stop all simulations');
  console.log('- MachineSimulator.startSimulation(\"machineId\", true) // Start specific machine');
  console.log('- MachineSimulator.simulateTemporaryOffline(\"machineId\", 300000) // 5 min offline');
  console.log('- MachineSimulator.simulateError(\"machineId\", \"COIN_JAM\", \"Coin mechanism jammed\", \"high\")');
  console.log('- MachineSimulator.printSimulationStatus() // Show status\n');
} else {
  console.log('⚠️ Machine Heartbeat Simulator is disabled in production environment');
  console.log('⚠️ Real IoT devices should send heartbeat signals via MachineService.updateHeartbeat()');
}

export default MachineHeartbeatSimulator;