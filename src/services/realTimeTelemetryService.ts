import { database } from '../config/firebase';
import { ref, push, set, get, onValue, off, update, query, orderByChild, limitToLast } from 'firebase/database';
import { Machine, TelemetryData, CleaningLog, Sale } from '../types';
import { MachineService } from './machineService';
import { MachineLogService } from './machineLogService';

/**
 * Real-Time Telemetry Service
 * Handles automatic data collection from machines every 15 seconds
 * Monitors temperature, cleaning status, and other critical parameters
 * 
 * ⚠️ PRODUCTION NOTICE: This service generates simulated telemetry data
 * In production, real IoT devices should send telemetry data via MachineService.addTelemetryData()
 */
export class RealTimeTelemetryService {
  private static activeIntervals: Map<string, NodeJS.Timeout> = new Map();
  private static readonly TELEMETRY_INTERVAL = 60000; // 1 minute
  private static isRunning = false;

  /**
   * Start real-time telemetry collection for all machines
   */
  static async startTelemetryCollection(): Promise<void> {
    // ⚠️ PRODUCTION CHECK: Disable simulator in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Telemetry simulator is disabled in production environment');
      console.warn('⚠️ Real IoT devices should send telemetry data via MachineService.addTelemetryData()');
      return;
    }

    if (this.isRunning) {
      console.log('⚠️ Real-time telemetry service already running');
      return;
    }

    console.log('🚀 [DEVELOPMENT] Starting real-time telemetry service - collecting data silently every minute');
    this.isRunning = true;

    try {
      // Get all machines
      const machines = await MachineService.getAllMachines();

      // Start telemetry for each machine
      for (const machine of machines) {
        await this.startMachineTelemetry(machine.id);
      }

      // Cleaning status monitoring removed

      console.log('✅ Real-time telemetry service started successfully');
    } catch (error) {
      console.error('❌ Failed to start telemetry service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop real-time telemetry collection
   */
  static async stopTelemetryCollection(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Real-time telemetry service not running');
      return;
    }

    console.log('⏹️ Stopping real-time telemetry service');
    
    // Stop all machine telemetry intervals
    this.activeIntervals.forEach((intervalId, machineId) => {
      clearInterval(intervalId);
    });
    
    // Log stopped machines
    const machineIds = Array.from(this.activeIntervals.keys());
    for (const machineId of machineIds) {
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
    }
    
    this.activeIntervals.clear();
    this.isRunning = false;
    
    console.log('✅ Real-time telemetry service stopped');
  }

  /**
   * Start telemetry collection for a specific machine
   */
  static async startMachineTelemetry(machineId: string): Promise<void> {
    // Stop existing telemetry if running
    this.stopMachineTelemetry(machineId);

    const machine = await MachineService.getMachine(machineId);
    if (!machine) {
      console.warn(`⚠️ Machine ${machineId} not found, skipping telemetry`);
      return;
    }

    const machineName = `${machine.name} (${machine.serialNumber})`;

    // Send initial telemetry data
    await this.collectTelemetryData(machineId);

    // Schedule regular telemetry collection
    const intervalId = setInterval(async () => {
      await this.collectTelemetryData(machineId);
    }, this.TELEMETRY_INTERVAL);

    this.activeIntervals.set(machineId, intervalId);
  }

  /**
   * Stop telemetry collection for a specific machine
   */
  static async stopMachineTelemetry(machineId: string): Promise<void> {
    const intervalId = this.activeIntervals.get(machineId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeIntervals.delete(machineId);
      
      const machine = await MachineService.getMachine(machineId);
      const machineName = machine ? `${machine.name} (${machine.serialNumber})` : machineId;
    }
  }

  /**
   * Collect telemetry data for a specific machine
   */
  static async collectTelemetryData(machineId: string): Promise<void> {
    try {
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        console.warn(`⚠️ Machine ${machineId} not found during telemetry collection`);
        return;
      }

      const machineName = `${machine.name} (${machine.serialNumber})`;
      
      // Generate realistic telemetry data based on machine type
      const telemetryData = await this.generateTelemetryData(machine);
      
      // Add telemetry data to database
      await MachineService.addTelemetryData(machineId, telemetryData);
      
      // No automatic cleaning alarms - only manual cleaning logs
      
      // No logging - data is collected silently
      
    } catch (error) {
      // Skip permission errors silently
      if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        return;
      }
      console.error(`❌ Error collecting telemetry for machine ${machineId}:`, error);
    }
  }

  /**
   * Generate realistic telemetry data based on machine type
   */
  private static async generateTelemetryData(machine: Machine): Promise<TelemetryData> {
    const now = new Date();
    const baseData: TelemetryData = {
      timestamp: now.toISOString(),
      powerStatus: true,
      doorStatus: false,
      errors: [],
      slotStatus: {},
      systemInfo: {
        uptime: Math.floor(Math.random() * 86400000), // Random uptime up to 24 hours
        memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
        diskSpace: Math.floor(Math.random() * 20) + 70 // 70-90%
      }
    };

    // Get sales data for this machine
    const salesData = await this.getSalesData(machine.id);

    // Add machine-specific data
    switch (machine.type) {
      case 'ice_cream':
        return {
          ...baseData,
          temperatureReadings: {
            internalTemperature: this.generateIceCreamTemperature(),
            ambientTemperature: this.generateAmbientTemperature(),
            refrigerationTemperature: this.generateRefrigerationTemperature(),
            compressorStatus: 'on',
            temperatureZone: 'main_chamber'
          },
          cleaningStatus: await this.getCleaningStatus(machine.id, 'ice_cream'),
          salesData: salesData
        };

      case 'snack':
        return {
          ...baseData,
          temperatureReadings: {
            internalTemperature: this.generateSnackTemperature(),
            ambientTemperature: this.generateAmbientTemperature(),
            refrigerationTemperature: this.generateRefrigerationTemperature(),
            compressorStatus: 'on',
            temperatureZone: 'refrigerated_section'
          },
          cleaningStatus: await this.getCleaningStatus(machine.id, 'snack'),
          salesData: salesData
        };

      case 'coffee':
        return {
          ...baseData,
          temperatureReadings: {
            internalTemperature: this.generateCoffeeTemperature(),
            ambientTemperature: this.generateAmbientTemperature(),
            refrigerationTemperature: undefined, // Coffee machines don't have refrigeration
            compressorStatus: undefined,
            temperatureZone: 'brew_group'
          },
          cleaningStatus: await this.getCleaningStatus(machine.id, 'coffee'),
          salesData: salesData
        };

      case 'perfume':
        return {
          ...baseData,
          temperatureReadings: {
            internalTemperature: this.generatePerfumeTemperature(),
            ambientTemperature: this.generateAmbientTemperature(),
            refrigerationTemperature: undefined,
            compressorStatus: undefined,
            temperatureZone: 'main_chamber'
          },
          cleaningStatus: await this.getCleaningStatus(machine.id, 'perfume'),
          salesData: salesData
        };

      default:
        return {
          ...baseData,
          salesData: salesData
        };
    }
  }

  /**
   * Get sales data for a machine
   */
  private static async getSalesData(machineId: string): Promise<TelemetryData['salesData']> {
    try {
      const salesRef = ref(database, 'sales');
      const snapshot = await get(salesRef);
      
      if (!snapshot.exists()) {
        return {
          todaySales: 0,
          todayTransactions: 0,
          weeklySales: 0,
          monthlySales: 0
        };
      }
      
      const allSales = snapshot.val();
      const machineSales = Object.values(allSales).filter((sale: any) => sale.machineId === machineId) as Sale[];
      
      if (machineSales.length === 0) {
        return {
          todaySales: 0,
          todayTransactions: 0,
          weeklySales: 0,
          monthlySales: 0
        };
      }
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculate today's sales
      const todaySales = machineSales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= todayStart;
      });
      
      // Calculate weekly sales
      const weeklySales = machineSales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= weekStart;
      });
      
      // Calculate monthly sales
      const monthlySales = machineSales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= monthStart;
      });
      
      // Get last sale timestamp
      const lastSale = machineSales.reduce((latest, sale) => 
        new Date(sale.timestamp) > new Date(latest.timestamp) ? sale : latest
      );
      
      // Get popular products (top 3)
      const productSales = machineSales.reduce((acc, sale) => {
        if (!acc[sale.productId]) {
          acc[sale.productId] = { productId: sale.productId, salesCount: 0 };
        }
        acc[sale.productId].salesCount++;
        return acc;
      }, {} as Record<string, { productId: string; salesCount: number }>);
      
      const popularProducts = Object.values(productSales)
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 3)
        .map(p => ({
          productId: p.productId,
          productName: `Product ${p.productId}`, // You might want to get actual product names
          salesCount: p.salesCount
        }));
      
      return {
        todaySales: todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        todayTransactions: todaySales.length,
        weeklySales: weeklySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        monthlySales: monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        lastSaleTimestamp: lastSale.timestamp,
        popularProducts: popularProducts
      };
      
    } catch (error) {
      console.error(`Error getting sales data for machine ${machineId}:`, error);
      return {
        todaySales: 0,
        todayTransactions: 0,
        weeklySales: 0,
        monthlySales: 0
      };
    }
  }

  // Temperature and sales check functions removed - no logging needed

  /**
   * Generate temperature readings for different machine types
   */
  private static generateIceCreamTemperature(): number {
    // Ice cream machines: -25°C to 5°C range
    return Math.floor(Math.random() * 30) - 25;
  }

  private static generateSnackTemperature(): number {
    // Snack machines: 4°C to 25°C range
    return Math.floor(Math.random() * 21) + 4;
  }

  private static generateCoffeeTemperature(): number {
    // Coffee machines: 65°C to 95°C range
    return Math.floor(Math.random() * 30) + 65;
  }

  private static generatePerfumeTemperature(): number {
    // Perfume machines: 20°C to 25°C range
    return Math.floor(Math.random() * 5) + 20;
  }

  private static generateAmbientTemperature(): number {
    // Ambient temperature: 15°C to 35°C
    return Math.floor(Math.random() * 20) + 15;
  }

  private static generateRefrigerationTemperature(): number {
    // Refrigeration temperature: -30°C to 10°C
    return Math.floor(Math.random() * 40) - 30;
  }

  /**
   * Get current cleaning status for a machine
   */
  private static async getCleaningStatus(machineId: string, machineType: 'ice_cream' | 'coffee' | 'snack' | 'perfume'): Promise<TelemetryData['cleaningStatus']> {
    try {
      // Check last cleaning date
      const lastCleaning = await this.getLastCleaningDate(machineId);
      const daysSinceLastCleaning = lastCleaning ? 
        Math.floor((Date.now() - new Date(lastCleaning).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      return {
        isInCleaningMode: false,
        lastCleaningTimestamp: lastCleaning,
        daysSinceLastCleaning: daysSinceLastCleaning
      };
      
    } catch (error) {
      console.error(`Error getting cleaning status for machine ${machineId}:`, error);
      return {
        isInCleaningMode: false,
        daysSinceLastCleaning: 999
      };
    }
  }

  /**
   * Get the last cleaning date for a machine
   */
  private static async getLastCleaningDate(machineId: string): Promise<string | null> {
    try {
      const cleaningLogsRef = ref(database, `cleaningLogs/${machineId}`);
      const snapshot = await get(cleaningLogsRef);
      
      if (snapshot.exists()) {
        const logs = snapshot.val();
        const logEntries = Object.values(logs) as CleaningLog[];
        
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

  // All automatic cleaning alarm functions removed - only manual cleaning logs

  // resolveActiveCleaningAlarms function removed - no automatic alarms to resolve

  /**
   * Log cleaning mode activation (called when cleaning mode is activated)
   */
  static async logCleaningModeActivation(machineId: string): Promise<void> {
    try {
      const machine = await MachineService.getMachine(machineId);
      if (!machine) return;

      // Log to both cleaning logs (for telemetry) and machine logs (for UI)
      const machineName = `${machine.name} (${machine.serialNumber})`;
      
      // Original cleaning log for telemetry
      const cleaningLog: Omit<CleaningLog, 'id'> = {
        machineId: machineId,
        timestamp: new Date().toISOString(),
        machineType: machine.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const cleaningLogsRef = ref(database, `cleaningLogs/${machineId}`);
      const newLogRef = push(cleaningLogsRef);
      await set(newLogRef, {
        ...cleaningLog,
        id: newLogRef.key!
      });

      // New machine log for UI
      await MachineLogService.logCleaning(machineId, machine);

      console.log(`🧹 Temizlik modu aktifleştirildi ${machineName} - Sisteme kaydedildi`);

    } catch (error) {
      console.error(`Error logging cleaning mode activation for machine ${machineId}:`, error);
    }
  }

  // startCleaningStatusMonitoring function removed - no automatic monitoring

  // monitorCleaningStatus function removed - no automatic monitoring

  // checkCleaningRequirements function removed - no automatic alarms

  // createCleaningWarning function removed - no automatic alarms

  /**
   * Get active telemetry status
   */
  static getActiveTelemetryMachines(): string[] {
    return Array.from(this.activeIntervals.keys());
  }

  /**
   * Check if telemetry is running
   */
  static isTelemetryRunning(): boolean {
    return this.isRunning;
  }
}

// Development helper functions
if (process.env.NODE_ENV === 'development') {
  (window as any).RealTimeTelemetry = {
    async start() {
      await RealTimeTelemetryService.startTelemetryCollection();
    },
    
    async stop() {
      await RealTimeTelemetryService.stopTelemetryCollection();
    },
    
    async startMachine(machineId: string) {
      await RealTimeTelemetryService.startMachineTelemetry(machineId);
    },
    
    async stopMachine(machineId: string) {
      await RealTimeTelemetryService.stopMachineTelemetry(machineId);
    },
    
    getStatus() {
      return {
        isRunning: RealTimeTelemetryService.isTelemetryRunning(),
        activeMachines: RealTimeTelemetryService.getActiveTelemetryMachines()
      };
    }
  };
  
  // Service loaded silently
}

export default RealTimeTelemetryService;
