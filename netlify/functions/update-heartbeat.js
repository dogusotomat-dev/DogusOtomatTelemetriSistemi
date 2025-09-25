const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let credential;
    
    // Check if we have service account JSON in environment variables
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Using service account credentials from environment');
    } else {
      // Fallback to application default credentials
      credential = admin.credential.applicationDefault();
      console.log('✅ Using application default credentials');
    }
    
    admin.initializeApp({
      credential: credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.REACT_APP_FIREBASE_DATABASE_URL
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

const db = admin.database();

exports.handler = async (event, context) => {
  console.log('🚀 Function started:', event.httpMethod, event.path);
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  // Simple test endpoint
  if (event.queryStringParameters?.test === 'true') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Function is working!',
        timestamp: new Date().toISOString(),
        method: event.httpMethod
      })
    };
  }

  // Allow both GET and POST requests
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request data (from body for POST or query for GET)
    let requestData;
    if (event.httpMethod === 'POST') {
      requestData = JSON.parse(event.body);
    } else {
      // For GET requests, parse from query string
      requestData = {
        machineId: event.queryStringParameters?.machineId,
        deviceData: event.queryStringParameters?.deviceData ? JSON.parse(event.queryStringParameters.deviceData) : null
      };
    }
    
    const { machineId, deviceData } = requestData;
    console.log('📝 Request data:', { machineId, deviceData });
    
    // Validate required fields
    if (!machineId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Machine ID is required' })
      };
    }

    const now = Date.now();
    console.log('⏰ Updating heartbeat for machine:', machineId, 'at', new Date(now).toISOString());
    
    // Check if machine exists, if not return error
    const machineRef = db.ref(`machines/${machineId}`);
    const machineSnapshot = await machineRef.once('value');
    
    if (!machineSnapshot.exists()) {
      console.log('❌ Machine not found:', machineId);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Machine not found',
          message: `Machine with ID ${machineId} does not exist. Please add the machine first.`
        })
      };
    }
    
    // Update heartbeat data
    await db.ref(`heartbeat/${machineId}`).update({
      lastSeen: now,
      status: 'online',
      deviceId: deviceData?.deviceId || null,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Heartbeat data updated');

    // Update machine connection info
    await db.ref(`machines/${machineId}/connectionInfo`).update({
      status: 'online',
      lastHeartbeat: new Date(now).toISOString()
    });
    console.log('✅ Machine connection info updated');

    // Update device-specific data if provided
    if (deviceData) {
      await db.ref(`machines/${machineId}/deviceStatus`).update({
        batteryLevel: deviceData.batteryLevel,
        signalStrength: deviceData.signalStrength,
        temperature: deviceData.temperature,
        lastError: deviceData.lastError || null,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Device status updated');
      
      // Also save as telemetry data for monitoring
      if (deviceData.powerStatus !== undefined || deviceData.operationalMode || deviceData.errors || deviceData.temperatureReadings) {
        const telemetryData = {
          timestamp: new Date().toISOString(),
          powerStatus: deviceData.powerStatus !== undefined ? deviceData.powerStatus : true,
          operationalMode: deviceData.operationalMode || 'normal',
          errors: deviceData.errors || [],
          temperatureReadings: deviceData.temperatureReadings || {},
          salesData: deviceData.salesData || {},
          cleaningStatus: deviceData.cleaningStatus || {},
          batteryLevel: deviceData.batteryLevel,
          signalStrength: deviceData.signalStrength,
          temperature: deviceData.temperature
        };
        
        await db.ref(`machines/${machineId}/telemetry`).push().set(telemetryData);
        console.log('✅ Telemetry data saved');
      }
    }

    console.log(`✅ Heartbeat updated for machine: ${machineId}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Heartbeat updated successfully',
        machineId: machineId,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Error updating heartbeat:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to update heartbeat',
        message: error.message,
        details: error.toString(),
        stack: error.stack
      })
    };
  }
};