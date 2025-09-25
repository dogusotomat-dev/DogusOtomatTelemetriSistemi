/**
 * Machine Heartbeat Receiver
 * Makinenin verilerini alır ve Firebase'e kaydeder
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const { machineId, deviceData } = body;
    
    if (!machineId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Machine ID is required' })
      };
    }

    // Firebase'e kaydet
    const firebase = require('firebase-admin');
    
    if (!firebase.apps.length) {
      firebase.initializeApp({
        credential: firebase.credential.applicationDefault()
      });
    }

    const db = firebase.database();
    const timestamp = new Date().toISOString();

    // Heartbeat verisini kaydet
    await db.ref(`heartbeat/${machineId}`).set({
      lastSeen: timestamp,
      status: 'online',
      deviceData: deviceData || {}
    });

    // Machine status'u güncelle
    await db.ref(`machines/${machineId}`).update({
      lastHeartbeat: timestamp,
      status: 'online'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Heartbeat received',
        timestamp
      })
    };

  } catch (error) {
    console.error('Heartbeat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
