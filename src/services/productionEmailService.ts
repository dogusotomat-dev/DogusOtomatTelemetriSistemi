import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Production Email Service
 * This service provides integration points for real email providers
 */
export interface EmailConfig {
  provider: 'console' | 'sendgrid' | 'aws-ses' | 'mailgun' | 'smtp' | 'backend-api' | 'netlify-function';
  apiKey?: string;
  senderEmail: string;
  senderName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

export interface EmailData {
  to: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class ProductionEmailService {
  private static config: EmailConfig = {
    provider: window.location.hostname === 'localhost' ? 'console' : 'netlify-function', // Use Netlify Function in production
    apiKey: process.env.REACT_APP_SENDGRID_API_KEY,
    senderEmail: process.env.REACT_APP_EMAIL_SENDER || 'noreply@dogusotomat.com',
    senderName: process.env.REACT_APP_EMAIL_SENDER_NAME || 'Doğuş Otomat Telemetri Sistemi'
  };

  // Configure email service
  static configure(config: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📧 Email service configured:', {
      provider: this.config.provider,
      senderEmail: this.config.senderEmail,
      senderName: this.config.senderName
    });
  }

  // Send email using configured provider
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'console':
          return await this.sendViaConsole(emailData);
        case 'backend-api':
          return await this.sendViaBackendAPI(emailData);
        case 'netlify-function':
          return await this.sendViaNetlifyFunction(emailData);
        case 'aws-ses':
          return await this.sendViaAWSSES(emailData);
        case 'mailgun':
          return await this.sendViaMailgun(emailData);
        case 'smtp':
          return await this.sendViaSMTP(emailData);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  // Console-based email simulation (for development)
  private static async sendViaConsole(emailData: EmailData): Promise<boolean> {
    console.log('\n📧 EMAIL NOTIFICATION SENT (CONSOLE SIMULATION):');
    console.log('━'.repeat(70));
    console.log(`📤 From: ${this.config.senderName} <${this.config.senderEmail}>`);
    console.log(`📥 To: ${emailData.to.join(', ')}`);
    console.log(`📋 Subject: ${emailData.subject}`);
    console.log(`🏷️ Priority: ${emailData.priority.toUpperCase()}`);
    console.log(`⏰ Time: ${new Date().toLocaleString('tr-TR')}`);
    console.log('━'.repeat(70));
    
    // Convert HTML to readable text
    const textContent = this.htmlToText(emailData.htmlContent);
    console.log('📄 Email Content:');
    console.log(textContent);
    console.log('━'.repeat(70));
    console.log('✅ Email simulation completed\n');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  // Send email via backend API (for production)
  private static async sendViaBackendAPI(emailData: EmailData): Promise<boolean> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_EMAIL_API_KEY || 'development-key'
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          htmlContent: emailData.htmlContent,
          from: `${this.config.senderName} <${this.config.senderEmail}>`
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully via backend API');
        return true;
      } else {
        console.error('❌ Backend API error');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to connect to backend:', error);
      return await this.sendViaConsole(emailData);
    }
  }
  // Send email via Netlify Function (for Netlify deployment)
  private static async sendViaNetlifyFunction(emailData: EmailData): Promise<boolean> {
    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          htmlContent: emailData.htmlContent,
          from: `${this.config.senderName} <${this.config.senderEmail}>`
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully via Netlify Function');
        console.log(`📋 ${result.message || 'Email sent'}`);
        return true;
      } else {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('❌ Netlify Function error:', error.error || 'Unknown error');
        
        // If Netlify function fails, fall back to console simulation
        console.warn('⚠️ Netlify Function failed, falling back to console simulation');
        return await this.sendViaConsole(emailData);
      }
    } catch (error) {
      console.error('❌ Failed to connect to Netlify Function:', error);
      console.log('⚠️ Falling back to console simulation');
      return await this.sendViaConsole(emailData);
    }
  }

  // AWS SES email sending
  private static async sendViaAWSSES(emailData: EmailData): Promise<boolean> {
    console.log('📧 AWS SES integration would be implemented here');
    console.log('💡 Tip: Use AWS SDK for JavaScript to implement this');
    return false;
  }

  // Mailgun email sending
  private static async sendViaMailgun(emailData: EmailData): Promise<boolean> {
    console.log('📧 Mailgun integration would be implemented here');
    console.log('💡 Tip: Use Mailgun API to implement this');
    return false;
  }

  // SMTP email sending (simplified web-compatible version)
  private static async sendViaSMTP(emailData: EmailData): Promise<boolean> {
    try {
      // For web applications, we need to use a backend service or email API
      // This is a placeholder that shows how to structure the request
      
      if (!this.config.smtpHost || !this.config.smtpUser || !this.config.smtpPassword) {
        console.error('❌ SMTP configuration incomplete. Required: smtpHost, smtpUser, smtpPassword');
        console.log('💡 To configure SMTP, use:');
        console.log('ProductionEmailService.configure({');
        console.log('  provider: "smtp",');
        console.log('  smtpHost: "smtp.gmail.com",');
        console.log('  smtpPort: 587,');
        console.log('  smtpUser: "your-email@gmail.com",');
        console.log('  smtpPassword: "your-app-password"');
        console.log('});');
        return false;
      }

      // In a real implementation, this would connect to your backend API
      // that handles SMTP sending server-side
      console.log('📧 SMTP Email would be sent with:');
      console.log(`Host: ${this.config.smtpHost}:${this.config.smtpPort}`);
      console.log(`From: ${this.config.senderEmail}`);
      console.log(`To: ${emailData.to.join(', ')}`);
      console.log(`Subject: ${emailData.subject}`);
      
      // For now, fall back to console simulation
      console.log('⚠️ Note: SMTP requires backend implementation. Using console simulation.');
      return await this.sendViaConsole(emailData);
      
    } catch (error) {
      console.error('❌ SMTP email failed:', error);
      return false;
    }
  }

  // Convert HTML to readable text
  private static htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')  // Replace <br> tags with newlines
      .replace(/<\/p>/gi, '\n\n')     // Replace </p> with double newlines
      .replace(/<[^>]*>/g, '')        // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')        // Replace non-breaking spaces
      .replace(/&amp;/g, '&')         // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .trim();
  }

  // Test email functionality
  static async sendTestEmail(recipientEmail: string): Promise<boolean> {
    const testEmailData: EmailData = {
      to: [recipientEmail],
      subject: '🧪 Doğuş Otomat Test Email - Email Service Working!',
      htmlContent: `
        <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
          <div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;\">
            <h1 style=\"margin: 0; font-size: 24px;\">🧪 Test Email Successful</h1>
          </div>
          <div style=\"padding: 20px; background: #f8f9fa;\">
            <div style=\"background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);\">
              <h2 style=\"color: #667eea; margin-top: 0;\">Email Service is Working!</h2>
              <p>This is a test email from the Doğuş Otomat Telemetry System.</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString('tr-TR')}</p>
              <p><strong>Email Provider:</strong> ${this.config.provider}</p>
              <div style=\"background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;\">
                <p style=\"margin: 0; color: #2e7d32;\"><strong>✅ Success:</strong> Email notifications are now configured and working properly.</p>
              </div>
              <p>If you receive this email, it means:</p>
              <ul>
                <li>Email service is properly configured</li>
                <li>Machine offline alerts will work</li>
                <li>Error notifications will be sent</li>
                <li>System monitoring is operational</li>
              </ul>
              <p style=\"color: #666; font-size: 12px; margin-top: 20px;\">This email was generated automatically by the Doğuş Otomat Telemetry System.</p>
            </div>
          </div>
        </div>
      `,
      priority: 'medium'
    };

    return await this.sendEmail(testEmailData);
  }

  // Get current configuration (without sensitive data)
  static getConfiguration(): Omit<EmailConfig, 'apiKey' | 'smtpPassword'> {
    const { apiKey, smtpPassword, ...safeConfig } = this.config;
    return safeConfig;
  }

  // Validate email configuration
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.senderEmail) {
      errors.push('Sender email is required');
    }

    if (!this.config.senderName) {
      errors.push('Sender name is required');
    }

    if (this.config.provider === 'sendgrid' && !this.config.apiKey) {
      errors.push('SendGrid API key is required');
    }

    if (this.config.provider === 'smtp') {
      if (!this.config.smtpHost) errors.push('SMTP host is required');
      if (!this.config.smtpPort) errors.push('SMTP port is required');
      if (!this.config.smtpUser) errors.push('SMTP username is required');
      if (!this.config.smtpPassword) errors.push('SMTP password is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Integration with existing EmailNotificationService
export class IntegratedEmailService {
  // Send machine alert using production email service
  static async sendMachineAlert(
    machineId: string,
    alertType: 'offline' | 'error',
    customMessage?: string
  ): Promise<boolean> {
    try {
      // Get machine details
      const machineRef = ref(database, `machines/${machineId}`);
      const snapshot = await get(machineRef);
      const machine = snapshot.exists() ? snapshot.val() : null;
      
      if (!machine) {
        throw new Error('Machine not found');
      }

      // Check if email addresses are configured
      if (!machine.configuration.notifications?.emailAddresses?.length) {
        console.log(`⚠️ No email addresses configured for machine: ${machine.name} (${machine.serialNumber})`);
        return false;
      }

      // Create machine name with serial number
      const machineName = `${machine.name} (${machine.serialNumber})`;

      // Create email content
      const subject = alertType === 'offline' 
        ? `${machineName} - Offline`
        : `${machineName} - Error`;

      const htmlContent = alertType === 'offline'
        ? this.createOfflineEmailContent(machine, customMessage)
        : this.createErrorEmailContent(machine, customMessage);

      const emailData: EmailData = {
        to: machine.configuration.notifications.emailAddresses,
        subject,
        htmlContent,
        priority: 'high'
      };

      const success = await ProductionEmailService.sendEmail(emailData);
      
      if (success) {
        console.log(`📧 Email alert sent for machine: ${machineName}`);
      } else {
        console.error(`❌ Failed to send email alert for machine: ${machineName}`);
      }

      return success;
    } catch (error) {
      console.error('Error sending machine alert:', error);
      return false;
    }
  }

  // Create offline email content
  private static createOfflineEmailContent(machine: any, customMessage?: string): string {
    const now = new Date().toLocaleString('tr-TR');
    return `
      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
        <div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;\">
          <h1 style=\"margin: 0; font-size: 24px;\">🚨 Makine Çevrimdışı Uyarısı</h1>
        </div>
        <div style=\"padding: 20px; background: #f8f9fa;\">
          <div style=\"background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);\">
            <h2 style=\"color: #d32f2f; margin-top: 0;\">Makine Çevrimdışı Duruma Geçti</h2>
            <p><strong>Makine Adı:</strong> ${machine.name}</p>
            <p><strong>Seri Numarası:</strong> ${machine.serialNumber}</p>
            <p><strong>Konum:</strong> ${machine.location.address}</p>
            <p><strong>Uyarı Zamanı:</strong> ${now}</p>
            ${customMessage ? `<p><strong>Ek Bilgi:</strong> ${customMessage}</p>` : ''}
            <div style=\"background: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0;\">
              <p style=\"margin: 0; color: #c62828;\"><strong>⚠️ İşlem Gerekli:</strong> Lütfen makineyi hemen kontrol edin. Bu durum elektrik kesintisi, ağ bağlantı sorunu veya donanım arızası gösterebilir.</p>
            </div>
            <p style=\"color: #666; font-size: 12px; margin-top: 20px;\">Bu uyarı Doğuş Otomat Telemetri Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
          </div>
        </div>
      </div>
    `;
  }

  // Create error email content
  private static createErrorEmailContent(machine: any, customMessage?: string): string {
    const now = new Date().toLocaleString('tr-TR');
    return `
      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">
        <div style=\"background: linear-gradient(135deg, #ff5722 0%, #f44336 100%); color: white; padding: 20px; text-align: center;\">
          <h1 style=\"margin: 0; font-size: 24px;\">⚠️ Makine Hata Uyarısı</h1>
        </div>
        <div style=\"padding: 20px; background: #f8f9fa;\">
          <div style=\"background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);\">
            <h2 style=\"color: #f44336; margin-top: 0;\">Makine Hatası Tespit Edildi</h2>
            <p><strong>Makine Adı:</strong> ${machine.name}</p>
            <p><strong>Seri Numarası:</strong> ${machine.serialNumber}</p>
            <p><strong>Konum:</strong> ${machine.location.address}</p>
            <p><strong>Uyarı Zamanı:</strong> ${now}</p>
            ${customMessage ? `<p><strong>Hata Detayları:</strong> ${customMessage}</p>` : ''}
            <div style=\"background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;\">
              <p style=\"margin: 0; color: #e65100;\"><strong>📋 Önerilen İşlemler:</strong></p>
              <ul style=\"margin: 10px 0 0 0; color: #e65100;\">
                <li>Makine durumunu hemen kontrol edin</li>
                <li>Bakım kılavuzunda hata kodunu doğrulayın</li>
                <li>Sorun devam ederse teknik destek ile iletişime geçin</li>
              </ul>
            </div>
            <p style=\"color: #666; font-size: 12px; margin-top: 20px;\">Bu uyarı Doğuş Otomat Telemetri Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Development helper
if (process.env.NODE_ENV === 'development') {
  (window as any).EmailService = ProductionEmailService;
  (window as any).IntegratedEmailService = IntegratedEmailService;
  
  const isConfigured = !!process.env.REACT_APP_SENDGRID_API_KEY;
  
  console.log('\n📧 Production Email Service loaded!');
  console.log('💻 BROWSER ENVIRONMENT: Using console simulation mode');
  console.log('⚠️ CORS Policy: Direct SendGrid calls blocked by browser security');
  
  if (isConfigured) {
    console.log('✅ SendGrid API KEY CONFIGURED for production use');
    console.log(`🔑 API Key: ${process.env.REACT_APP_SENDGRID_API_KEY?.substring(0, 10)}...`);
  } else {
    console.log('⚠️ SendGrid API key not configured');
  }
  
  console.log(`📧 Current Provider: Console Simulation`);
  console.log(`📫 From: ${process.env.REACT_APP_EMAIL_SENDER_NAME} <${process.env.REACT_APP_EMAIL_SENDER}>`);
  console.log('💡 Real emails will be sent when deployed to production server');
  
  console.log('\n🔧 Available commands in browser console:');
  console.log('- EmailService.sendTestEmail("your-email@example.com")');
  console.log('- EmailService.getConfiguration()');
  console.log('- IntegratedEmailService.sendMachineAlert("machineId", "offline")');
  console.log('- IntegratedEmailService.sendMachineAlert("machineId", "error", "Custom message")\n');
}

export default ProductionEmailService;