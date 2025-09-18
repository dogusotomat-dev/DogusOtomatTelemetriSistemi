const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Use Firebase Admin SDK credentials for server-side functions
  // These environment variables should be set in Netlify dashboard
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.REACT_APP_FIREBASE_DATABASE_URL
  });
}

const db = admin.database();

exports.handler = async (event, context) => {
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
    
    // Update heartbeat data
    await db.ref(`heartbeat/${machineId}`).update({
      lastSeen: now,
      status: 'online',
      deviceId: deviceData?.deviceId || null,
      updatedAt: new Date().toISOString()
    });

    // Update machine connection info
    await db.ref(`machines/${machineId}/connectionInfo`).update({
      status: 'online',
      lastHeartbeat: new Date(now).toISOString()
    });

    // Update device-specific data if provided
    if (deviceData) {
      await db.ref(`machines/${machineId}/deviceStatus`).update({
        batteryLevel: deviceData.batteryLevel,
        signalStrength: deviceData.signalStrength,
        temperature: deviceData.temperature,
        lastError: deviceData.lastError || null,
        lastUpdated: new Date().toISOString()
      });
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
        details: error.toString()
      })
    };
  }
};