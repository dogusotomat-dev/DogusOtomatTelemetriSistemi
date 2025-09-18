import { database } from '../config/firebase';
import { ref, push, set, get, onValue, off, update, query, orderByChild, equalTo } from 'firebase/database';
import { MachineCommand, MachineCommandType, CommandResponse, CommandQueue } from '../types';
import { MachineService } from './machineService';

export class MachineCommandService {
  
  /**
   * Send a command to a machine
   * @param machineId - Target machine ID
   * @param commandType - Type of command to send
   * @param parameters - Command parameters
   * @param priority - Command priority
   * @param createdBy - User who created the command
   * @param timeout - Command timeout in seconds (default: 60)
   * @returns Command ID
   */
  static async sendCommand(
    machineId: string,
    commandType: MachineCommandType,
    parameters: Record<string, any> = {},
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
    createdBy: string,
    timeout: number = 60
  ): Promise<string> {
    try {
      // Validate machine exists and get details
      const machine = await MachineService.getMachine(machineId);
      if (!machine) {
        throw new Error(`Machine with ID ${machineId} not found`);
      }

      // Create command
      const commandsRef = ref(database, 'machineCommands');
      const newCommandRef = push(commandsRef);
      const commandId = newCommandRef.key!;

      const command: MachineCommand = {
        id: commandId,
        machineId,
        type: commandType,
        parameters,
        priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        timeout,
        retryCount: 0,
        maxRetries: this.getMaxRetries(priority),
        createdBy
      };

      await set(newCommandRef, command);

      // Add to machine's command queue
      await this.addToCommandQueue(machineId, command);

      // Also send to Netlify Functions for real IoT devices
      try {
        await this.sendToNetlifyFunctions(machineId, commandType, parameters);
      } catch (netlifyError) {
        console.warn('⚠️ Failed to send command to Netlify Functions:', netlifyError);
        // Continue anyway - command is saved to Firebase
      }

      // Log command creation
      const machineName = `${machine.name} (${machine.serialNumber})`;
      console.log(`📤 Komut gönderildi ${machineName}: ${commandType} (ID: ${commandId})`);

      // If machine is online, try to notify immediately
      if (machine.connectionInfo.status === 'online') {
        await this.notifyMachineOfNewCommand(machineId);
      }

      return commandId;

    } catch (error) {
      console.error('❌ Error sending command:', error);
      throw error;
    }
  }

  /**
   * Send command to Netlify Functions for real IoT devices
   */
  private static async sendToNetlifyFunctions(
    machineId: string,
    commandType: MachineCommandType,
    parameters: Record<string, any>
  ): Promise<void> {
    // Map command types to Netlify Functions format
    const commandMap: Record<string, string> = {
      'ICE_CREAM_SET_MODE': 'maintenance_mode',
      'ICE_CREAM_START': 'start',
      'ICE_CREAM_STOP': 'stop',
      'SNACK_SET_MODE': 'maintenance_mode',
      'SNACK_START': 'start',
      'SNACK_STOP': 'stop',
      'COFFEE_SET_MODE': 'maintenance_mode',
      'COFFEE_START': 'start',
      'COFFEE_STOP': 'stop',
      'PERFUME_SET_MODE': 'maintenance_mode',
      'PERFUME_START': 'start',
      'PERFUME_STOP': 'stop'
    };

    const netlifyCommand = commandMap[commandType];
    if (!netlifyCommand) {
      console.log(`ℹ️ Command ${commandType} not mapped to Netlify Functions`);
      return;
    }

    const response = await fetch('/.netlify/functions/remote-control', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        machineId,
        command: netlifyCommand,
        parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Netlify Functions error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Command sent to Netlify Functions:`, result);
  }

  /**
   * Add command to machine's command queue
   */
  private static async addToCommandQueue(machineId: string, command: MachineCommand): Promise<void> {
    const queueRef = ref(database, `machines/${machineId}/commandQueue`);
    const newQueueItemRef = push(queueRef);
    await set(newQueueItemRef, {
      commandId: command.id,
      type: command.type,
      parameters: command.parameters,
      priority: command.priority,
      createdAt: command.createdAt,
      status: 'pending'
    });
  }

  /**
   * Notify machine of new command (if online)
   */
  private static async notifyMachineOfNewCommand(machineId: string): Promise<void> {
    try {
      // Update machine's last command timestamp
      const machineRef = ref(database, `machines/${machineId}`);
      await update(machineRef, {
        lastCommandAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn('⚠️ Failed to notify machine of new command:', error);
    }
  }

  /**
   * Get maximum retries based on priority
   */
  private static getMaxRetries(priority: string): number {
    switch (priority) {
      case 'critical': return 5;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  /**
   * Get command by ID
   */
  static async getCommand(commandId: string): Promise<MachineCommand | null> {
    try {
      const commandRef = ref(database, `machineCommands/${commandId}`);
      const snapshot = await get(commandRef);
      
      if (snapshot.exists()) {
        return snapshot.val() as MachineCommand;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting command:', error);
      throw error;
    }
  }

  /**
   * Get commands for a specific machine
   */
  static async getMachineCommands(machineId: string, limit: number = 50): Promise<MachineCommand[]> {
    try {
      const commandsRef = ref(database, 'machineCommands');
      const queryRef = query(
        commandsRef,
        orderByChild('machineId'),
        equalTo(machineId)
      );
      
      const snapshot = await get(queryRef);
      
      if (snapshot.exists()) {
        const commands = snapshot.val() as Record<string, MachineCommand>;
        return Object.values(commands)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error getting machine commands:', error);
      throw error;
    }
  }

  /**
   * Update command status
   */
  static async updateCommandStatus(
    commandId: string,
    status: 'pending' | 'sent' | 'delivered' | 'executed' | 'failed' | 'timeout',
    response?: CommandResponse
  ): Promise<void> {
    try {
      const commandRef = ref(database, `machineCommands/${commandId}`);
      const updates: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (response) {
        updates.response = response;
      }

      await update(commandRef, updates);
      console.log(`✅ Command ${commandId} status updated to: ${status}`);
    } catch (error) {
      console.error('❌ Error updating command status:', error);
      throw error;
    }
  }

  /**
   * Process command timeouts
   */
  static async processCommandTimeouts(): Promise<void> {
    try {
      const commandsRef = ref(database, 'machineCommands');
      const queryRef = query(
        commandsRef,
        orderByChild('status'),
        equalTo('pending')
      );
      
      const snapshot = await get(queryRef);
      
      if (snapshot.exists()) {
        const commands = snapshot.val() as Record<string, MachineCommand>;
        const now = Date.now();
        
        for (const [commandId, command] of Object.entries(commands)) {
          const commandTime = new Date(command.createdAt).getTime();
          const timeoutMs = command.timeout * 1000;
          
          if (now - commandTime > timeoutMs) {
            await this.updateCommandStatus(commandId, 'timeout');
            console.log(`⏰ Command ${commandId} timed out`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing command timeouts:', error);
    }
  }

  // Command processing service
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start command processing service
   */
  static startProcessing(): void {
    if (this.intervalId) {
      console.log('⚠️ Command processing already running');
      return;
    }
    
    console.log('🚀 Starting command processing service - checking every 30 seconds');
    
    // Process timeouts every 30 seconds
    this.intervalId = setInterval(async () => {
      await MachineCommandService.processCommandTimeouts();
    }, 30000);
  }
  
  static stopProcessing(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Command processing service stopped');
    }
  }
}
