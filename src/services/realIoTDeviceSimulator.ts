import { RealIoTDeviceService } from './realIoTDeviceService';
import { MachineService } from './machineService';

/**
 * Real IoT Device Simulator
 * Simulates real IoT devices sending heartbeat and telemetry data
 * This is for testing purposes when real IoT devices are not available
 */
export class RealIoTDeviceSimulator {
  private static simulationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private static isSimulating = false;

  /**
   * Start simulating IoT devices for all machines
   */
  static async startSimulation(): Promise<void> {
    // ⚠️ PRODUCTION CHECK: Disable simulator in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ IoT device simulator is disabled in production environment');
      console.warn('⚠️ Real IoT devices should send data via RealIoTDeviceService.processDeviceHeartbeat()');
      return;
    }

    if (this.isSimulating) {
      console.log('⚠️ IoT device simulation is already running');
      return;
    }

    try {
      const machines = await MachineService.getAllMachines();
      
      if (machines.length === 0) {
        console.log('📊 No machines found for IoT simulation');
        return;
      }

      this.isSimulating = true;
      console.log(`🚀 [DEVELOPMENT] Starting IoT device simulation for ${machines.length} machines`);

      // Start simulation for each machine
      for (const machine of machines) {
        if (machine.iotNumber) {
          await this.startMachineSimulation(machine.id, machine.iotNumber, machine.type);
        }
      }

      console.log('✅ [DEVELOPMENT] IoT device simulation started successfully');
      
    } catch (error) {
      console.error('❌ Error starting IoT device simulation:', error);
      this.isSimulating = false;
    }
  }

  /**
   * Stop all IoT device simulations
   */
  static stopSimulation(): void {
    if (!this.isSimulating) {
      console.log('⚠️ IoT device simulation is not running');
      return;
    }

    // Clear all intervals
    this.simulationIntervals.forEach((interval, machineId) => {
      clearInterval(interval);
      console.log(`🛑 [DEVELOPMENT] Stopped IoT simulation for machine: ${machineId}`);
    });

    this.simulationIntervals.clear();
    this.isSimulating = false;
    console.log('✅ [DEVELOPMENT] IoT device simulation stopped');
  }

  /**
   * Start simulation for a specific machine
   */
  private static async startMachineSimulation(
    machineId: string, 
    iotNumber: string, 
    machineType: string
  ): Promise<void> {
    try {
      // Random interval between 30-120 seconds for heartbeat
      const heartbeatInterval = Math.random() * 90000 + 30000; // 30-120 seconds
      
      // Random interval between 60-300 seconds for telemetry
      const telemetryInterval = Math.random() * 240000 + 60000; // 60-300 seconds

      // Start heartbeat simulation
      const heartbeatIntervalId = setInterval(async () => {
        await this.simulateHeartbeat(iotNumber, machineType);
      }, heartbeatInterval);

      // Start telemetry simulation
      const telemetryIntervalId = setInterval(async () => {
        await this.simulateTelemetry(iotNumber, machineType);
      }, telemetryInterval);

      // Store intervals
      this.simulationIntervals.set(`${machineId}_heartbeat`, heartbeatIntervalId);
      this.simulationIntervals.set(`${machineId}_telemetry`, telemetryIntervalId);

      console.log(`🟢 [DEVELOPMENT] Started IoT simulation for machine: ${machineId} (${iotNumber})`);
      
    } catch (error) {
      console.error(`❌ Error starting simulation for machine ${machineId}:`, error);
    }
  }

  /**
   * Simulate heartbeat from IoT device
   */
  private static async simulateHeartbeat(iotNumber: string, machineType: string): Promise<void> {
    try {
      // Simulate device data
      const deviceData = {
        batteryLevel: Math.random() * 100, // 0-100%
        signalStrength: Math.random() * 100, // 0-100%
        temperature: this.getRandomTemperature(machineType),
        lastError: Math.random() < 0.1 ? 'Minor sensor reading' : undefined // 10% chance of error
      };

      const result = await RealIoTDeviceService.processDeviceHeartbeat(iotNumber, deviceData);
      
      if (result.success) {
        console.log(`💓 [DEVELOPMENT] Heartbeat sent: ${iotNumber} - Battery: ${deviceData.batteryLevel.toFixed(1)}%, Signal: ${deviceData.signalStrength.toFixed(1)}%`);
      } else {
        console.warn(`⚠️ [DEVELOPMENT] Heartbeat failed: ${iotNumber} - ${result.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Error simulating heartbeat for ${iotNumber}:`, error);
    }
  }

  /**
   * Simulate telemetry data from IoT device
   */
  private static async simulateTelemetry(iotNumber: string, machineType: string): Promise<void> {
    try {
      const telemetryData = {
        timestamp: new Date().toISOString(),
        powerStatus: Math.random() > 0.05, // 95% chance of being powered
        doorStatus: Math.random() > 0.1, // 90% chance of door being closed
        temperatureReadings: {
          internalTemperature: this.getRandomTemperature(machineType),
          ambientTemperature: 20 + Math.random() * 10, // 20-30°C
          refrigerationTemperature: machineType === 'ice_cream' ? -20 + Math.random() * 10 : undefined,
          compressorStatus: machineType === 'ice_cream' ? (Math.random() > 0.1 ? 'on' as const : 'off' as const) : undefined,
          temperatureZone: 'main'
        },
        errors: Math.random() < 0.05 ? [{ // 5% chance of errors
          code: 'TEMP_HIGH',
          message: 'Temperature above normal range',
          timestamp: new Date().toISOString(),
          severity: 'medium' as const
        }] : [],
        slotStatus: this.generateSlotStatus(machineType),
        systemInfo: {
          uptime: Math.random() * 86400, // 0-24 hours
          memoryUsage: Math.random() * 100, // 0-100%
          diskSpace: Math.random() * 100 // 0-100%
        },
        salesData: {
          todaySales: Math.random() * 1000,
          todayTransactions: Math.floor(Math.random() * 50),
          weeklySales: Math.random() * 5000,
          monthlySales: Math.random() * 20000
        },
        cleaningStatus: {
          isInCleaningMode: Math.random() < 0.05, // 5% chance of being in cleaning mode
          lastCleaningTimestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // 0-7 days ago
          daysSinceLastCleaning: Math.floor(Math.random() * 7) // 0-7 days
        }
      };

      const result = await RealIoTDeviceService.processDeviceTelemetry(iotNumber, telemetryData);
      
      if (result.success) {
        console.log(`📊 [DEVELOPMENT] Telemetry sent: ${iotNumber} - Temp: ${telemetryData.temperatureReadings.internalTemperature.toFixed(1)}°C, Power: ${telemetryData.powerStatus ? 'ON' : 'OFF'}`);
      } else {
        console.warn(`⚠️ [DEVELOPMENT] Telemetry failed: ${iotNumber} - ${result.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Error simulating telemetry for ${iotNumber}:`, error);
    }
  }

  /**
   * Get random temperature based on machine type
   */
  private static getRandomTemperature(machineType: string): number {
    switch (machineType) {
      case 'ice_cream':
        return -20 + Math.random() * 10; // -20 to -10°C
      case 'coffee':
        return 70 + Math.random() * 30; // 70 to 100°C
      case 'snack':
        return 15 + Math.random() * 20; // 15 to 35°C
      case 'perfume':
        return 20 + Math.random() * 10; // 20 to 30°C
      default:
        return 20 + Math.random() * 10; // 20 to 30°C
    }
  }

  /**
   * Generate slot status for different machine types
   */
  private static generateSlotStatus(machineType: string): Record<string, any> {
    const slotStatus: Record<string, any> = {};
    
    // Generate different number of slots based on machine type
    let slotCount = 8; // Default
    switch (machineType) {
      case 'ice_cream':
        slotCount = 12;
        break;
      case 'coffee':
        slotCount = 6;
        break;
      case 'snack':
        slotCount = 16;
        break;
      case 'perfume':
        slotCount = 4;
        break;
    }

    for (let i = 1; i <= slotCount; i++) {
      slotStatus[`slot_${i}`] = {
        occupied: Math.random() > 0.3, // 70% chance of being occupied
        productId: Math.random() > 0.3 ? `product_${Math.floor(Math.random() * 100)}` : undefined,
        quantity: Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : 0,
        price: Math.random() > 0.3 ? Math.random() * 50 + 5 : 0
      };
    }

    return slotStatus;
  }

  /**
   * Get simulation status
   */
  static getSimulationStatus(): { isSimulating: boolean; activeSimulations: number } {
    return {
      isSimulating: this.isSimulating,
      activeSimulations: this.simulationIntervals.size
    };
  }

  /**
   * Add a new machine to simulation
   */
  static async addMachineToSimulation(machineId: string, iotNumber: string, machineType: string): Promise<void> {
    if (!this.isSimulating) {
      console.log('⚠️ IoT simulation is not running. Start simulation first.');
      return;
    }

    await this.startMachineSimulation(machineId, iotNumber, machineType);
  }

  /**
   * Remove a machine from simulation
   */
  static removeMachineFromSimulation(machineId: string): void {
    const heartbeatInterval = this.simulationIntervals.get(`${machineId}_heartbeat`);
    const telemetryInterval = this.simulationIntervals.get(`${machineId}_telemetry`);

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      this.simulationIntervals.delete(`${machineId}_heartbeat`);
    }

    if (telemetryInterval) {
      clearInterval(telemetryInterval);
      this.simulationIntervals.delete(`${machineId}_telemetry`);
    }

    console.log(`🛑 [DEVELOPMENT] Removed machine ${machineId} from IoT simulation`);
  }
}

// Development helper functions
if (process.env.NODE_ENV === 'development') {
  (window as any).RealIoTSimulator = {
    start: () => RealIoTDeviceSimulator.startSimulation(),
    stop: () => RealIoTDeviceSimulator.stopSimulation(),
    status: () => RealIoTDeviceSimulator.getSimulationStatus(),
    addMachine: (machineId: string, iotNumber: string, machineType: string) => 
      RealIoTDeviceSimulator.addMachineToSimulation(machineId, iotNumber, machineType),
    removeMachine: (machineId: string) => 
      RealIoTDeviceSimulator.removeMachineFromSimulation(machineId)
  };
  
  console.log('🔧 Real IoT Simulator loaded! Use window.RealIoTSimulator to control simulation');
}

export default RealIoTDeviceSimulator;
