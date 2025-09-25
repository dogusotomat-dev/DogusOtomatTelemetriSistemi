const net = require('net');
const https = require('https');

const SERVER_PORT = 8080;
const API_URL = 'https://dogusotomattelemetrisistemi.netlify.app/.netlify/functions/update-heartbeat';

console.log('🚀 Socket Server başlatılıyor...');

const server = net.createServer((socket) => {
  console.log('🔌 Makine bağlandı:', socket.remoteAddress);
  
  let dataBuffer = '';
  
  socket.on('data', (data) => {
    dataBuffer += data.toString();
    console.log('📨 Veri alındı:', dataBuffer);
    
    // Makinenin protokol formatını parse et
    const matches = dataBuffer.match(/###9003\$\{([^}]+)\}\$[A-F0-9]+&&&/);
    
    if (matches) {
      try {
        const machineData = JSON.parse(matches[1]);
        console.log('✅ Makine verisi:', machineData);
        
        // HTTP API'ye gönder
        sendToAPI(machineData);
        
        // Makineye yanıt gönder
        socket.write('###9003${"status":"ok"}$47F89022&&&\n');
        
        dataBuffer = '';
      } catch (error) {
        console.error('❌ Parse hatası:', error);
      }
    }
  });
  
  socket.on('close', () => {
    console.log('🔌 Bağlantı kapandı');
  });
  
  socket.on('error', (error) => {
    console.error('❌ Socket hatası:', error);
  });
});

function sendToAPI(machineData) {
  const postData = JSON.stringify({
    machineId: machineData.Mid,
    deviceData: {
      batteryLevel: 85,
      signalStrength: 90,
      temperature: machineData.TankTemperature || 25,
      deviceId: `machine-${machineData.Mid}`,
      statusCode: machineData.Code,
      workMode: machineData.Status,
      tankTemperature: machineData.TankTemperature,
      troughTemperature: machineData.TroughTemperature,
      lastCleanedTime: machineData.LastCleanedTime,
      lockCause: machineData.LockCause
    }
  });
  
  const options = {
    hostname: 'dogusotomattelemetrisistemi.netlify.app',
    port: 443,
    path: '/.netlify/functions/update-heartbeat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    res.on('end', () => {
      console.log('✅ API yanıtı:', responseData);
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ API hatası:', error);
  });
  
  req.write(postData);
  req.end();
}

server.listen(SERVER_PORT, () => {
  console.log(`📡 Socket Server çalışıyor: Port ${SERVER_PORT}`);
  console.log(`🔗 ngrok ile dışarıya açın: ngrok tcp ${SERVER_PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server kapatılıyor...');
  server.close(() => {
    process.exit(0);
  });
});
