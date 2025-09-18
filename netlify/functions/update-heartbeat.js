// Simple HTTP client for Firebase REST API
const https = require('https');

// Firebase REST API helper
function firebaseRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const databaseURL = process.env.REACT_APP_FIREBASE_DATABASE_URL;
    if (!databaseURL) {
      reject(new Error('Firebase Database URL not found'));
      return;
    }

    const url = new URL(`${databaseURL}${path}.json`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : null;
          resolve(parsedData);
        } catch (error) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

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
    
    // Update heartbeat data using Firebase REST API
    await firebaseRequest(`heartbeat/${machineId}`, 'PATCH', {
      lastSeen: now,
      status: 'online',
      deviceId: deviceData?.deviceId || null,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Heartbeat data updated');

    // Update machine connection info
    await firebaseRequest(`machines/${machineId}/connectionInfo`, 'PATCH', {
      status: 'online',
      lastHeartbeat: new Date(now).toISOString()
    });
    console.log('✅ Machine connection info updated');

    // Update device-specific data if provided
    if (deviceData) {
      await firebaseRequest(`machines/${machineId}/deviceStatus`, 'PATCH', {
        batteryLevel: deviceData.batteryLevel,
        signalStrength: deviceData.signalStrength,
        temperature: deviceData.temperature,
        lastError: deviceData.lastError || null,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Device status updated');
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