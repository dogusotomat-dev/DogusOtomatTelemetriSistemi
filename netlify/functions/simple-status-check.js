const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let credential;
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      credential = admin.credential.cert(serviceAccount);
    } else {
      credential = admin.credential.applicationDefault();
    }
    
    admin.initializeApp({
      credential: credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.REACT_APP_FIREBASE_DATABASE_URL
    });
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

const db = admin.database();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🔍 Simple machine status check...');
    
    // Get all machines
    const machinesSnapshot = await db.ref('machines').once('value');
    const machines = machinesSnapshot.val() || {};
    
    console.log(`📊 Total machines: ${Object.keys(machines).length}`);
    
    const machineStatuses = [];
    
    for (const [machineId, machine] of Object.entries(machines)) {
      try {
        // Get heartbeat data
        const heartbeatSnapshot = await db.ref(`heartbeat/${machineId}`).once('value');
        
        if (!heartbeatSnapshot.exists()) {
          machineStatuses.push({
            id: machineId,
            name: machine.name,
            status: 'offline',
            reason: 'No heartbeat data'
          });
          continue;
        }
        
        const heartbeatData = heartbeatSnapshot.val();
        const now = Date.now();
        const timeSinceLastHeartbeat = now - heartbeatData.lastSeen;
        const minutesSinceLastHeartbeat = Math.floor(timeSinceLastHeartbeat / 60000);
        
        machineStatuses.push({
          id: machineId,
          name: machine.name,
          status: timeSinceLastHeartbeat < 30 * 60 * 1000 ? 'online' : 'offline',
          lastSeen: heartbeatData.lastSeen,
          minutesSinceLastHeartbeat: minutesSinceLastHeartbeat,
          heartbeatData: heartbeatData
        });
        
      } catch (error) {
        console.error(`❌ Error checking machine ${machineId}:`, error);
        machineStatuses.push({
          id: machineId,
          name: machine.name,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Machine status check completed',
        timestamp: new Date().toISOString(),
        stats: {
          totalMachines: Object.keys(machines).length,
          onlineMachines: machineStatuses.filter(m => m.status === 'online').length,
          offlineMachines: machineStatuses.filter(m => m.status === 'offline').length,
          errorMachines: machineStatuses.filter(m => m.status === 'error').length
        },
        machines: machineStatuses
      })
    };
    
  } catch (error) {
    console.error('❌ Error in simple status check:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Status check failed',
        message: error.message
      })
    };
  }
};
