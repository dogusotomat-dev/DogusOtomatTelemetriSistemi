import { database } from '../config/firebase';
import { ref, remove, get, update, query, orderByChild, limitToLast } from 'firebase/database';
import { Alarm } from '../types';

export class AlarmService {
  /**
   * Delete an alarm (admin only)
   */
  static async deleteAlarm(alarmId: string): Promise<void> {
    try {
      console.log(`🗑️ Attempting to delete alarm: ${alarmId}`);
      
      const alarmRef = ref(database, `alarms/${alarmId}`);
      const snapshot = await get(alarmRef);
      
      if (!snapshot.exists()) {
        console.log(`❌ Alarm not found: ${alarmId}`);
        throw new Error('Alarm not found');
      }
      
      console.log(`✅ Alarm found, proceeding with deletion: ${alarmId}`);
      await remove(alarmRef);
      console.log(`🗑️ Alarm successfully deleted: ${alarmId}`);
    } catch (error) {
      console.error('❌ Error deleting alarm:', error);
      console.error('Error details:', {
        alarmId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Delete multiple alarms (admin only)
   */
  static async deleteMultipleAlarms(alarmIds: string[]): Promise<void> {
    try {
      const deletePromises = alarmIds.map(alarmId => this.deleteAlarm(alarmId));
      await Promise.all(deletePromises);
      console.log(`🗑️ Deleted ${alarmIds.length} alarms`);
    } catch (error) {
      console.error('Error deleting multiple alarms:', error);
      throw error;
    }
  }

  /**
   * Delete all resolved alarms (admin only)
   */
  static async deleteResolvedAlarms(): Promise<void> {
    try {
      const alarmsRef = ref(database, 'alarms');
      const snapshot = await get(alarmsRef);
      
      if (!snapshot.exists()) {
        return;
      }
      
      const alarms = snapshot.val();
      const resolvedAlarmIds: string[] = [];
      
      Object.keys(alarms).forEach(alarmId => {
        if (alarms[alarmId].status === 'resolved') {
          resolvedAlarmIds.push(alarmId);
        }
      });
      
      if (resolvedAlarmIds.length > 0) {
        await this.deleteMultipleAlarms(resolvedAlarmIds);
        console.log(`🗑️ Deleted ${resolvedAlarmIds.length} resolved alarms`);
      } else {
        console.log('No resolved alarms to delete');
      }
    } catch (error) {
      console.error('Error deleting resolved alarms:', error);
      throw error;
    }
  }

  /**
   * Delete old alarms (older than specified days)
   */
  static async deleteOldAlarms(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffTimestamp = cutoffDate.toISOString();
      
      const alarmsRef = ref(database, 'alarms');
      const snapshot = await get(alarmsRef);
      
      if (!snapshot.exists()) {
        return;
      }
      
      const alarms = snapshot.val();
      const oldAlarmIds: string[] = [];
      
      Object.keys(alarms).forEach(alarmId => {
        if (alarms[alarmId].timestamp < cutoffTimestamp) {
          oldAlarmIds.push(alarmId);
        }
      });
      
      if (oldAlarmIds.length > 0) {
        await this.deleteMultipleAlarms(oldAlarmIds);
        console.log(`🗑️ Deleted ${oldAlarmIds.length} alarms older than ${daysOld} days`);
      } else {
        console.log(`No alarms older than ${daysOld} days found`);
      }
    } catch (error) {
      console.error('Error deleting old alarms:', error);
      throw error;
    }
  }

  /**
   * Test alarm deletion (for debugging)
   */
  static async testAlarmDeletion(): Promise<void> {
    try {
      console.log('🧪 Testing alarm deletion...');
      
      // Get first alarm for testing
      const alarmsRef = ref(database, 'alarms');
      const snapshot = await get(alarmsRef);
      
      if (!snapshot.exists()) {
        console.log('❌ No alarms found for testing');
        return;
      }
      
      const alarms = snapshot.val();
      const firstAlarmId = Object.keys(alarms)[0];
      
      if (!firstAlarmId) {
        console.log('❌ No alarm IDs found');
        return;
      }
      
      console.log(`🧪 Testing deletion of alarm: ${firstAlarmId}`);
      
      // Test deletion
      await this.deleteAlarm(firstAlarmId);
      
      console.log('✅ Test deletion successful!');
    } catch (error) {
      console.error('❌ Test deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get alarm statistics
   */
  static async getAlarmStatistics(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const alarmsRef = ref(database, 'alarms');
      const snapshot = await get(alarmsRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          active: 0,
          acknowledged: 0,
          resolved: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };
      }
      
      const alarms = snapshot.val();
      const stats = {
        total: 0,
        active: 0,
        acknowledged: 0,
        resolved: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
      
      Object.values(alarms).forEach((alarm: any) => {
        stats.total++;
        
        switch (alarm.status) {
          case 'active':
            stats.active++;
            break;
          case 'acknowledged':
            stats.acknowledged++;
            break;
          case 'resolved':
            stats.resolved++;
            break;
        }
        
        switch (alarm.severity) {
          case 'critical':
            stats.critical++;
            break;
          case 'high':
            stats.high++;
            break;
          case 'medium':
            stats.medium++;
            break;
          case 'low':
            stats.low++;
            break;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting alarm statistics:', error);
      throw error;
    }
  }
}
