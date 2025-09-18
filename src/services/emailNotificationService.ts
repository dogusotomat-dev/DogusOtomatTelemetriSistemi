import { ref, push, set, get, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { Alarm, Machine } from '../types';

export interface EmailNotification {
  id: string;
  type: 'offline' | 'error' | 'maintenance' | 'warning';
  machineId: string;
  machineName: string;
  recipients: string[];
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  alarmId?: string;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  type: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
}

class EmailNotificationService {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 5000;
  
  // Email templates for different notification types
  private static readonly EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
    offline: {
      type: 'offline',
      subject: '{machineName} - Offline',
      htmlTemplate: `
        <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
          <div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;\">
            <h1 style=\"margin: 0; font-size: 24px;\">{machineName} - Offline</h1>
          </div>
          <div style=\"padding: 20px; background: #f8f9fa;\">
            <div style=\"background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);\">
              <h2 style=\"color: #d32f2f; margin-top: 0;\">Machine Has Gone Offline</h2>
              <p><strong>Machine Name:</strong> {machineName}</p>
              <p><strong>Serial Number:</strong> {serialNumber}</p>
              <p><strong>Location:</strong> {location}</p>
              <p><strong>Last Seen:</strong> {lastSeen}</p>
              <p><strong>Offline Duration:</strong> {offlineDuration}</p>
              <div style=\"background: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0;\">
                <p style=\"margin: 0; color: #c62828;\"><strong>⚠️ Action Required:</strong> Please check the machine immediately. This could indicate a power outage, network connectivity issue, or hardware failure.</p>
              </div>
              <p style=\"color: #666; font-size: 12px; margin-top: 20px;\">This alert was generated automatically by the Doğuş Otomat Telemetry System.</p>
            </div>
          </div>
        </div>
      `,
      textTemplate: `
MACHINE OFFLINE ALERT

Machine Name: {machineName}
Serial Number: {serialNumber}
Location: {location}
Last Seen: {lastSeen}
Offline Duration: {offlineDuration}

Action Required: Please check the machine immediately.
This could indicate a power outage, network connectivity issue, or hardware failure.

This alert was generated automatically by the Doğuş Otomat Telemetry System.
      `
    },
    error: {
      type: 'error',
      subject: '{machineName} - Error',
      htmlTemplate: `
        <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
          <div style=\"background: linear-gradient(135deg, #ff5722 0%, #f44336 100%); color: white; padding: 20px; text-align: center;\">
            <h1 style=\"margin: 0; font-size: 24px;\">{machineName} - Error</h1>
          </div>
          <div style=\"padding: 20px; background: #f8f9fa;\">
            <div style=\"background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);\">
              <h2 style=\"color: #f44336; margin-top: 0;\">Machine Error Detected</h2>
              <p><strong>Machine Name:</strong> {machineName}</p>
              <p><strong>Error Code:</strong> <code style=\"background: #f5f5f5; padding: 2px 6px; border-radius: 3px;\">{errorCode}</code></p>
              <p><strong>Error Message:</strong> {errorMessage}</p>
              <p><strong>Severity:</strong> <span style=\"background: {severityColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; text-transform: uppercase;\">{severity}</span></p>
              <p><strong>Timestamp:</strong> {timestamp}</p>
              <div style=\"background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;\">
                <p style=\"margin: 0; color: #e65100;\"><strong>📋 Recommended Actions:</strong></p>
                <ul style=\"margin: 10px 0 0 0; color: #e65100;\">
                  <li>Check machine status immediately</li>
                  <li>Verify error code in maintenance manual</li>
                  <li>Contact technical support if issue persists</li>
                </ul>
              </div>
              <p style=\"color: #666; font-size: 12px; margin-top: 20px;\">This alert was generated automatically by the Doğuş Otomat Telemetry System.</p>
            </div>
          </div>
        </div>
      `,
      textTemplate: `
MACHINE ERROR ALERT

Machine Name: {machineName}
Error Code: {errorCode}
Error Message: {errorMessage}
Severity: {severity}
Timestamp: {timestamp}

Recommended Actions:
- Check machine status immediately
- Verify error code in maintenance manual
- Contact technical support if issue persists

This alert was generated automatically by the Doğuş Otomat Telemetry System.
      `
    }
  };

  // Create email notification from alarm
  static async createNotificationFromAlarm(alarm: Alarm): Promise<void> {
    try {
      // Get machine details
      const machine = await this.getMachineDetails(alarm.machineId);
      if (!machine) {
        console.error(`Machine not found for alarm: ${alarm.id}`);
        return;
      }

      // Check if notifications are enabled for this machine
      if (!machine.configuration.notifications?.emailAddresses?.length) {
        console.log(`Makine için email adresi yapılandırılmamış: ${machine.name}`);
        return;
      }

      // Check if this type of alert is enabled
      const isOfflineAlert = alarm.type === 'offline';
      const isErrorAlert = alarm.type === 'error';
      
      if (isOfflineAlert && !machine.configuration.notifications.enableOfflineAlerts) {
        console.log(`Makine için offline uyarıları devre dışı: ${machine.name}`);
        return;
      }
      
      if (isErrorAlert && !machine.configuration.notifications.enableErrorAlerts) {
        console.log(`Makine için hata uyarıları devre dışı: ${machine.name}`);
        return;
      }

      // Create notification
      const notification: Omit<EmailNotification, 'id'> = {
        type: alarm.type as 'offline' | 'error' | 'maintenance' | 'warning',
        machineId: alarm.machineId,
        machineName: `${machine.name} (${machine.serialNumber})`,
        recipients: machine.configuration.notifications.emailAddresses,
        subject: this.generateSubject(alarm, machine),
        message: this.generateMessage(alarm, machine),
        priority: this.mapSeverityToPriority(alarm.severity),
        timestamp: new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        alarmId: alarm.id,
        metadata: {
          machineSerialNumber: machine.serialNumber,
          machineLocation: machine.location.address,
          alarmCode: alarm.code,
          alarmSeverity: alarm.severity
        }
      };

      await this.saveNotification(notification);
      console.log(`Email notification created for alarm: ${alarm.id}`);
      
    } catch (error) {
      console.error('Error creating notification from alarm:', error);
    }
  }

  // Generate email subject
  private static generateSubject(alarm: Alarm, machine: Machine): string {
    const template = this.EMAIL_TEMPLATES[alarm.type];
    const machineName = `${machine.name} (${machine.serialNumber})`;
    if (!template) return `Alert: ${machineName} - ${alarm.message}`;
    
    return template.subject
      .replace('{machineName}', machineName)
      .replace('{serialNumber}', machine.serialNumber)
      .replace('{severity}', alarm.severity.toUpperCase());
  }

  // Generate email message
  private static generateMessage(alarm: Alarm, machine: Machine): string {
    const template = this.EMAIL_TEMPLATES[alarm.type];
    if (!template) return this.generateFallbackMessage(alarm, machine);
    
    const variables = this.prepareTemplateVariables(alarm, machine);
    
    return this.replaceTemplateVariables(template.htmlTemplate, variables);
  }

  // Prepare template variables
  private static prepareTemplateVariables(alarm: Alarm, machine: Machine): Record<string, string> {
    const lastSeen = machine.connectionInfo.lastHeartbeat 
      ? new Date(machine.connectionInfo.lastHeartbeat).toLocaleString('tr-TR')
      : 'Unknown';
    
    const offlineDuration = alarm.metadata?.offlineDuration 
      ? this.formatDuration(alarm.metadata.offlineDuration)
      : 'Unknown';
    
    const severityColor = this.getSeverityColor(alarm.severity);
    
    return {
      machineName: machine.name,
      serialNumber: machine.serialNumber,
      location: machine.location.address,
      lastSeen,
      offlineDuration,
      errorCode: alarm.code,
      errorMessage: alarm.message,
      severity: alarm.severity.toUpperCase(),
      severityColor,
      timestamp: new Date(alarm.timestamp).toLocaleString('tr-TR')
    };
  }

  // Replace template variables
  private static replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\\\{${key}\\\\}`, 'g'), value);
    }
    return result;
  }

  // Generate fallback message
  private static generateFallbackMessage(alarm: Alarm, machine: Machine): string {
    return `
      <div style=\"font-family: Arial, sans-serif;\">
        <h2>Machine Alert</h2>
        <p><strong>Machine:</strong> ${machine.name}</p>
        <p><strong>Alert Type:</strong> ${alarm.type}</p>
        <p><strong>Message:</strong> ${alarm.message}</p>
        <p><strong>Severity:</strong> ${alarm.severity}</p>
        <p><strong>Time:</strong> ${new Date(alarm.timestamp).toLocaleString('tr-TR')}</p>
      </div>
    `;
  }

  // Get machine details
  private static async getMachineDetails(machineId: string): Promise<Machine | null> {
    try {
      const machineRef = ref(database, `machines/${machineId}`);
      const snapshot = await get(machineRef);
      return snapshot.exists() ? snapshot.val() as Machine : null;
    } catch (error) {
      console.error('Error fetching machine details:', error);
      return null;
    }
  }

  // Save notification to database
  private static async saveNotification(notification: Omit<EmailNotification, 'id'>): Promise<string> {
    try {
      // Instead of saving to Firebase (which requires additional security rules),
      // we'll directly send the email notification for now
      console.log('📧 Processing email notification:', {
        type: notification.type,
        machineId: notification.machineId,
        machineName: notification.machineName,
        recipients: notification.recipients,
        subject: notification.subject
      });
      
      // For now, we'll simulate sending the email by logging it
      // In production, this would integrate with an email service like SendGrid, AWS SES, etc.
      await this.simulateEmailSend(notification);
      
      const notificationId = 'local-' + Date.now();
      console.log(`✅ Email notification processed: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error processing notification:', error);
      throw error;
    }
  }

  // Simulate email sending (replace with actual email service in production)
  private static async simulateEmailSend(notification: Omit<EmailNotification, 'id'>): Promise<void> {
    console.log('\n📬 EMAIL NOTIFICATION SENT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 To: ${notification.recipients.join(', ')}`);
    console.log(`📋 Subject: ${notification.subject}`);
    console.log(`🏷️  Priority: ${notification.priority.toUpperCase()}`);
    console.log(`🤖 Makine: ${notification.machineName}`);
    console.log(`⏰ Time: ${new Date().toLocaleString('tr-TR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Show the HTML content in a readable format
    const textVersion = this.htmlToText(notification.message);
    console.log('📄 Email Content:');
    console.log(textVersion);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Convert HTML to readable text for console display
  private static htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&')  // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .trim();
  }

  // Map alarm severity to notification priority
  private static mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  // Get severity color for email templates
  private static getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  }

  // Format duration in milliseconds to readable format
  private static formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours} saat ${remainingMinutes} dakika`;
    } else {
      return `${minutes} dakika`;
    }
  }

  // Send test notification (for testing purposes)
  static async sendTestNotification(machineId: string, testType: 'offline' | 'error' = 'offline'): Promise<void> {
    try {
      const machine = await this.getMachineDetails(machineId);
      if (!machine) {
        throw new Error('Machine not found');
      }
      
      // Create test alarm
      const testAlarm: Alarm = {
        id: 'test-' + Date.now(),
        machineId: machineId,
        type: testType,
        code: testType === 'offline' ? 'MACHINE_OFFLINE' : 'TEST_ERROR',
        message: testType === 'offline' 
          ? 'Machine has been offline for testing'
          : 'Test error message for notification testing',
        severity: 'high',
        status: 'active',
        timestamp: new Date().toISOString(),
        metadata: {
          testNotification: true,
          offlineDuration: testType === 'offline' ? 300000 : undefined // 5 minutes
        }
      };
      
      await this.createNotificationFromAlarm(testAlarm);
      console.log('Test notification created successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Legacy Firebase notification methods removed to prevent permission errors
  // These methods tried to access 'notifications/pending' path which requires additional Firebase rules
  // Email notifications now use IntegratedEmailService directly
  
  // Get pending notifications - deprecated (Firebase access removed)
  static async getPendingNotifications(): Promise<EmailNotification[]> {
    console.log('getPendingNotifications: This method is deprecated. Email notifications now use IntegratedEmailService.');
    return [];
  }

  // Mark notification as sent - deprecated (Firebase access removed)
  static async markNotificationAsSent(notificationId: string): Promise<void> {
    console.log('markNotificationAsSent: This method is deprecated. Email notifications now use IntegratedEmailService.');
  }

  // Mark notification as failed - deprecated (Firebase access removed)
  static async markNotificationAsFailed(notificationId: string, errorMessage: string): Promise<void> {
    console.log('markNotificationAsFailed: This method is deprecated. Email notifications now use IntegratedEmailService.');
  }
}

export default EmailNotificationService;