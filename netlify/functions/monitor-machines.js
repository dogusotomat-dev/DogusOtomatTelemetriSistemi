import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to get credentials from environment variable
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const databaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://dogus-otomat-telemetri-sistemi-default-rtdb.europe-west1.firebasedatabase.app/';
    
    if (credentialsJson) {
      const serviceAccount = JSON.parse(credentialsJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseUrl
      });
    } else {
      // Fallback to default credentials
      admin.initializeApp({
        databaseURL: databaseUrl
      });
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

const db = admin.database();

const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Allow both GET and POST (GET for manual testing, POST for scheduled execution)
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Check if this is a scheduled execution (from external cron service)
  const isScheduled = event.headers && (
    event.headers['x-netlify-scheduled-function'] || 
    event.headers['x-cron-secret'] ||
    event.queryStringParameters?.cron === 'true'
  );

  try {
    if (isScheduled) {
      console.log('⏰ Scheduled machine monitoring started (every 2 minutes)');
    } else {
      console.log('🔍 Manual machine monitoring started');
    }
    
    // Get all machines
    const machinesSnapshot = await db.ref('machines').once('value');
    const machines = machinesSnapshot.val() || {};
    
    // Filter valid machines
    const validMachines = Object.values(machines).filter(machine => 
      machine && 
      machine.id && 
      machine.name && 
      machine.serialNumber &&
      machine.name !== 'undefined' &&
      machine.serialNumber !== 'undefined'
    );
    
    console.log(`📊 Found ${validMachines.length} valid machines`);
    
    const now = Date.now();
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    const CRITICAL_OFFLINE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
    
    let offlineCount = 0;
    let criticalOfflineCount = 0;
    let alarmsCreated = 0;
    
    // Check each machine
    for (const machine of validMachines) {
      try {
        // Get heartbeat data
        const heartbeatSnapshot = await db.ref(`heartbeat/${machine.id}`).once('value');
        
        if (!heartbeatSnapshot.exists()) {
          // No heartbeat data - machine is offline
          console.log(`⚠️ No heartbeat data for machine: ${machine.name} (${machine.serialNumber})`);
          await createOfflineAlarm(machine, 'NO_HEARTBEAT');
          offlineCount++;
          continue;
        }
        
        const heartbeatData = heartbeatSnapshot.val();
        
        // Validate lastSeen timestamp
        if (!heartbeatData.lastSeen || typeof heartbeatData.lastSeen !== 'number') {
          console.log(`⚠️ Invalid heartbeat data for machine: ${machine.name} (${machine.serialNumber})`);
          await createOfflineAlarm(machine, 'INVALID_HEARTBEAT');
          offlineCount++;
          continue;
        }
        
        const timeSinceLastHeartbeat = now - heartbeatData.lastSeen;
        
        // Check if machine is offline
        if (timeSinceLastHeartbeat > OFFLINE_THRESHOLD) {
          console.log(`❌ Machine offline: ${machine.name} (${machine.serialNumber}) - ${Math.floor(timeSinceLastHeartbeat / 60000)}m ago`);
          
          // Check if it's critical offline
          if (timeSinceLastHeartbeat > CRITICAL_OFFLINE_THRESHOLD) {
            await createOfflineAlarm(machine, 'CRITICAL_OFFLINE');
            criticalOfflineCount++;
          } else {
            await createOfflineAlarm(machine, 'OFFLINE');
          }
          
          offlineCount++;
        } else {
          console.log(`✅ Machine online: ${machine.name} (${machine.serialNumber})`);
          
          // Check for telemetry-based alarms
          await checkTelemetryAlarms(machine);
        }
        
      } catch (machineError) {
        console.error(`❌ Error checking machine ${machine.id}:`, machineError);
      }
    }
    
    // Check cleaning requirements
    await checkCleaningRequirements(validMachines);
    
    const result = {
      success: true,
      message: isScheduled ? 'Scheduled machine monitoring completed' : 'Manual machine monitoring completed',
      timestamp: new Date().toISOString(),
      executionType: isScheduled ? 'scheduled' : 'manual',
      stats: {
        totalMachines: validMachines.length,
        offlineMachines: offlineCount,
        criticalOfflineMachines: criticalOfflineCount,
        alarmsCreated: alarmsCreated
      }
    };
    
    console.log('📊 Monitoring completed:', result.stats);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('❌ Monitoring error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Monitoring failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Create offline alarm
async function createOfflineAlarm(machine, alarmType) {
  try {
    const alarmData = {
      machineId: machine.id,
      type: 'offline',
      code: alarmType,
      message: getAlarmMessage(alarmType, machine),
      severity: alarmType === 'CRITICAL_OFFLINE' ? 'critical' : 'high',
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    // Check if similar alarm already exists
    const existingAlarmsSnapshot = await db.ref('alarms')
      .orderByChild('machineId')
      .equalTo(machine.id)
      .orderByChild('status')
      .equalTo('active')
      .once('value');
    
    const existingAlarms = existingAlarmsSnapshot.val() || {};
    const hasSimilarAlarm = Object.values(existingAlarms).some(alarm => 
      alarm.type === 'offline' && alarm.status === 'active'
    );
    
    if (!hasSimilarAlarm) {
      const newAlarmRef = await db.ref('alarms').push();
      await newAlarmRef.set({
        ...alarmData,
        id: newAlarmRef.key
      });
      
      console.log(`🚨 Offline alarm created: ${machine.name} (${alarmType})`);
      
      // Send email notification
      await sendEmailNotification(machine, alarmData);
    }
    
  } catch (error) {
    console.error(`❌ Error creating offline alarm for ${machine.id}:`, error);
  }
}

// Check telemetry-based alarms
async function checkTelemetryAlarms(machine) {
  try {
    // Get latest telemetry data
    const telemetrySnapshot = await db.ref(`machines/${machine.id}/telemetry`)
      .orderByChild('timestamp')
      .limitToLast(1)
      .once('value');
    
    if (!telemetrySnapshot.exists()) {
      return; // No telemetry data
    }
    
    const telemetryData = Object.values(telemetrySnapshot.val())[0];
    
    // Check for operational mode changes
    if (telemetryData.operationalMode) {
      const currentMode = telemetryData.operationalMode;
      const lastMode = machine.lastOperationalMode;
      
      // Valid modes: Automatic/Auto, Keep Fresh/Preservation, Standby
      const validModes = ['Automatic', 'Auto', 'Keep Fresh', 'Preservation', 'Standby'];
      
      if (lastMode && lastMode !== currentMode && validModes.includes(currentMode)) {
        console.log(`🔄 Mode change detected for ${machine.name}: ${lastMode} → ${currentMode}`);
        
        // Create mode change alarm
        const alarmRef = await db.ref('alarms').push();
        await alarmRef.set({
          machineId: machine.id,
          type: 'mode_change',
          code: 'MODE_CHANGE',
          message: `Çalışma modu değişti: ${lastMode} → ${currentMode}`,
          severity: 'medium',
          status: 'active',
          timestamp: new Date().toISOString(),
          details: {
            previousMode: lastMode,
            currentMode: currentMode
          }
        });
        
        // Send email notification
        await sendEmailNotification(machine, {
          type: 'mode_change',
          code: 'MODE_CHANGE',
          message: `Çalışma modu değişti: ${lastMode} → ${currentMode}`,
          severity: 'medium',
          timestamp: new Date().toISOString(),
          status: 'active'
        });
        
        // Update machine's last operational mode
        await db.ref(`machines/${machine.id}`).update({
          lastOperationalMode: currentMode
        });
      }
    }
    
    // Check for power issues
    if (telemetryData.powerStatus === false) {
      await createTelemetryAlarm(machine, 'POWER_OFF', 'Makine güç kesintisi');
      
      // Update power outage counter
      const powerOutageStart = machine.powerOutageStart || new Date().toISOString();
      const hoursWithoutPower = Math.floor((new Date().getTime() - new Date(powerOutageStart).getTime()) / (60 * 60 * 1000));
      
      await db.ref(`machines/${machine.id}`).update({
        powerOutageStart: powerOutageStart,
        hoursWithoutPower: hoursWithoutPower,
        lastPowerCheck: new Date().toISOString()
      });
    } else {
      // Power is back - reset counter
      if (machine.powerOutageStart) {
        await db.ref(`machines/${machine.id}`).update({
          powerOutageStart: null,
          hoursWithoutPower: 0,
          lastPowerCheck: new Date().toISOString()
        });
      }
    }
    
    // Check for errors
    if (telemetryData.errors && telemetryData.errors.length > 0) {
      await createTelemetryAlarm(machine, 'MACHINE_ERROR', `Makine hatası: ${telemetryData.errors.join(', ')}`);
    }
    
    // Check for temperature issues
    if (telemetryData.temperatureReadings) {
      const temperatures = Object.values(telemetryData.temperatureReadings);
      const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
      
      if (avgTemp > 5) { // Too warm for ice cream
        await createTelemetryAlarm(machine, 'TEMPERATURE_HIGH', `Sıcaklık çok yüksek: ${avgTemp.toFixed(1)}°C`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error checking telemetry alarms for ${machine.id}:`, error);
  }
}

// Create telemetry alarm
async function createTelemetryAlarm(machine, alarmType, message) {
  try {
    const alarmData = {
      machineId: machine.id,
      type: 'error',
      code: alarmType,
      message: message,
      severity: 'high',
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    // Check if similar alarm already exists
    const existingAlarmsSnapshot = await db.ref('alarms')
      .orderByChild('machineId')
      .equalTo(machine.id)
      .orderByChild('status')
      .equalTo('active')
      .once('value');
    
    const existingAlarms = existingAlarmsSnapshot.val() || {};
    const hasSimilarAlarm = Object.values(existingAlarms).some(alarm => 
      alarm.type === 'error' && alarm.code === alarmType && alarm.status === 'active'
    );
    
    if (!hasSimilarAlarm) {
      const newAlarmRef = await db.ref('alarms').push();
      await newAlarmRef.set({
        ...alarmData,
        id: newAlarmRef.key
      });
      
      console.log(`🚨 Telemetry alarm created: ${machine.name} (${alarmType})`);
      
      // Send email notification
      await sendEmailNotification(machine, alarmData);
    }
    
  } catch (error) {
    console.error(`❌ Error creating telemetry alarm for ${machine.id}:`, error);
  }
}

// Check cleaning requirements
async function checkCleaningRequirements(machines) {
  try {
    const now = Date.now();
    const CLEANING_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const machine of machines) {
      // Get last cleaning log
      const cleaningLogsSnapshot = await db.ref(`cleaningLogs/${machine.id}`)
        .orderByChild('timestamp')
        .limitToLast(1)
        .once('value');
      
      let daysSinceCleaning = 0;
      
      if (!cleaningLogsSnapshot.exists()) {
        // No cleaning logs - create alarm and set counter
        daysSinceCleaning = Math.floor((now - new Date(machine.createdAt || now).getTime()) / (24 * 60 * 60 * 1000));
        await createCleaningAlarm(machine, 'NEVER_CLEANED');
      } else {
        const lastCleaning = Object.values(cleaningLogsSnapshot.val())[0];
        const timeSinceCleaning = now - new Date(lastCleaning.timestamp).getTime();
        daysSinceCleaning = Math.floor(timeSinceCleaning / (24 * 60 * 60 * 1000));
        
        if (timeSinceCleaning > CLEANING_THRESHOLD) {
          await createCleaningAlarm(machine, 'CLEANING_OVERDUE');
        }
      }
      
      // Update cleaning counter in machine data
      await db.ref(`machines/${machine.id}`).update({
        daysSinceCleaning: daysSinceCleaning,
        lastCleaningCheck: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking cleaning requirements:', error);
  }
}

// Create cleaning alarm
async function createCleaningAlarm(machine, alarmType) {
  try {
    const alarmData = {
      machineId: machine.id,
      type: 'maintenance',
      code: alarmType,
      message: getCleaningAlarmMessage(alarmType, machine),
      severity: 'medium',
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    // Check if similar alarm already exists
    const existingAlarmsSnapshot = await db.ref('alarms')
      .orderByChild('machineId')
      .equalTo(machine.id)
      .orderByChild('status')
      .equalTo('active')
      .once('value');
    
    const existingAlarms = existingAlarmsSnapshot.val() || {};
    const hasSimilarAlarm = Object.values(existingAlarms).some(alarm => 
      alarm.type === 'maintenance' && alarm.code === alarmType && alarm.status === 'active'
    );
    
    if (!hasSimilarAlarm) {
      const newAlarmRef = await db.ref('alarms').push();
      await newAlarmRef.set({
        ...alarmData,
        id: newAlarmRef.key
      });
      
      console.log(`🧹 Cleaning alarm created: ${machine.name} (${alarmType})`);
      
      // Send email notification
      await sendEmailNotification(machine, alarmData);
    }
    
  } catch (error) {
    console.error(`❌ Error creating cleaning alarm for ${machine.id}:`, error);
  }
}

// Send email notification
async function sendEmailNotification(machine, alarmData) {
  try {
    // Get machine email addresses
    const emailAddresses = machine.configuration?.notifications?.emailAddresses || [];
    
    if (emailAddresses.length === 0) {
      console.log(`⚠️ No email addresses configured for machine: ${machine.name}`);
      return;
    }
    
    // Check if notifications are enabled
    if (alarmData.type === 'offline' && !machine.configuration?.notifications?.enableOfflineAlerts) {
      console.log(`⚠️ Offline alerts disabled for machine: ${machine.name}`);
      return;
    }
    
    if (alarmData.type === 'error' && !machine.configuration?.notifications?.enableErrorAlerts) {
      console.log(`⚠️ Error alerts disabled for machine: ${machine.name}`);
      return;
    }
    
    // Create email data
    const emailData = {
      to: emailAddresses,
      subject: `${machine.name} - ${getAlarmTitle(alarmData.type)}`,
      htmlContent: createEmailContent(machine, alarmData),
      priority: alarmData.severity === 'critical' ? 'critical' : 'high'
    };
    
    // Send email via Netlify function
    const response = await fetch(`${process.env.URL || 'https://dogusotomattelemetrisistemi.netlify.app'}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });
    
    if (response.ok) {
      console.log(`📧 Email notification sent for ${machine.name}: ${alarmData.type}`);
    } else {
      console.error(`❌ Failed to send email for ${machine.name}: ${response.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Error sending email notification for ${machine.id}:`, error);
  }
}

// Helper functions
function getAlarmMessage(alarmType, machine) {
  switch (alarmType) {
    case 'NO_HEARTBEAT':
      return `${machine.name} makinesinden heartbeat verisi alınamıyor`;
    case 'INVALID_HEARTBEAT':
      return `${machine.name} makinesinden geçersiz heartbeat verisi alındı`;
    case 'OFFLINE':
      return `${machine.name} makinesi çevrimdışı`;
    case 'CRITICAL_OFFLINE':
      return `${machine.name} makinesi kritik süre boyunca çevrimdışı`;
    default:
      return `${machine.name} makinesinde bilinmeyen alarm`;
  }
}

function getCleaningAlarmMessage(alarmType, machine) {
  switch (alarmType) {
    case 'NEVER_CLEANED':
      return `${machine.name} makinesi hiç temizlenmemiş`;
    case 'CLEANING_OVERDUE':
      return `${machine.name} makinesi temizlik süresini aştı`;
    default:
      return `${machine.name} makinesinde temizlik alarmı`;
  }
}

function getAlarmTitle(alarmType) {
  switch (alarmType) {
    case 'offline':
      return 'Makine Çevrimdışı';
    case 'error':
      return 'Makine Hatası';
    case 'maintenance':
      return 'Bakım Gerekli';
    case 'mode_change':
      return 'Çalışma Modu Değişikliği';
    default:
      return 'Sistem Alarmı';
  }
}

function createEmailContent(machine, alarmData) {
  const now = new Date().toLocaleString('tr-TR');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #dc3545; margin: 0;">🚨 Doğuş Otomat Alarm Sistemi</h2>
        <p style="margin: 10px 0; color: #666;">${now}</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #dee2e6;">
        <h3 style="color: #333; margin-top: 0;">Alarm Detayları</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Makine:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${machine.name} (${machine.serialNumber})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Alarm Tipi:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${getAlarmTitle(alarmData.type)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Önem:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${alarmData.severity.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Mesaj:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${alarmData.message}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Zaman:</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(alarmData.timestamp).toLocaleString('tr-TR')}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
          <p style="margin: 0; color: #856404;"><strong>Önemli:</strong> Bu alarm otomatik olarak oluşturulmuştur. Lütfen makineyi kontrol edin.</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>Bu email Doğuş Otomat Telemetri Sistemi tarafından otomatik olarak gönderilmiştir.</p>
      </div>
    </div>
  `;
}

// Export the handler for manual calls
export { handler };
export default handler;
