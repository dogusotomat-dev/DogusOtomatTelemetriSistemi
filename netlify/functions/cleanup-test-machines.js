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

/**
 * Test makinesi olup olmadığını kontrol et
 */
function isTestMachine(machine) {
  if (!machine) return false;
  
  // Test makinesi kriterleri
  const testCriteria = [
    // İsim kontrolü
    machine.name?.includes('Test Makinesi'),
    machine.name?.includes('Emülatör Makinesi'),
    machine.name?.includes('TEST'),
    machine.name?.includes('Test'),
    
    // Model kontrolü
    machine.model?.includes('DGS-ICE-TEST'),
    machine.model?.includes('DGS-ICE-EMULATOR'),
    machine.model?.includes('TEST'),
    
    // IoT numarası kontrolü
    machine.iotNumber?.includes('TEST-'),
    machine.iotNumber?.includes('IOT-'),
    
    // Lokasyon kontrolü
    machine.location?.address?.includes('Test Lokasyonu'),
    machine.location?.address?.includes('Emülatör Lokasyonu'),
    
    // Serial number kontrolü
    machine.serialNumber?.includes('TEST'),
    machine.serialNumber?.includes('SN-'),
    
    // ID kontrolü
    machine.id?.includes('TEST'),
    machine.id?.includes('NEW_'),
    machine.id?.includes('REAL_'),
    machine.id?.includes('BRAND_'),
    machine.id?.includes('COMPLETELY_'),
    machine.id?.includes('NEVER_'),
    machine.id?.includes('ABSOLUTELY_'),
    machine.id?.includes('TOTALLY_')
  ];
  
  return testCriteria.some(criteria => criteria === true);
}

exports.handler = async (event, context) => {
  console.log('🚀 Test Makinelerini Temizleme Fonksiyonu Başlatılıyor...');
  
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

  try {
    console.log('🔍 Test makineleri aranıyor...');
    
    // Tüm makineleri getir
    const machinesSnapshot = await db.ref('machines').once('value');
    const machines = machinesSnapshot.val() || {};
    
    console.log(`📊 Toplam makine sayısı: ${Object.keys(machines).length}`);
    
    const testMachines = [];
    const realMachines = [];
    
    // Makineleri kategorize et
    for (const [machineId, machine] of Object.entries(machines)) {
      if (isTestMachine(machine)) {
        testMachines.push({ id: machineId, ...machine });
      } else {
        realMachines.push({ id: machineId, ...machine });
      }
    }
    
    console.log(`🧪 Test makineleri: ${testMachines.length}`);
    console.log(`✅ Gerçek makineler: ${realMachines.length}`);
    
    if (testMachines.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Temizlenecek test makinesi bulunamadı!',
          stats: {
            totalMachines: Object.keys(machines).length,
            testMachines: 0,
            realMachines: realMachines.length,
            deletedMachines: 0
          }
        })
      };
    }
    
    // Test makinelerini sil
    let deletedCount = 0;
    const deletedMachines = [];
    
    for (const machine of testMachines) {
      try {
        console.log(`🗑️  Siliniyor: ${machine.name} (${machine.id})`);
        
        // Makineyi sil
        await db.ref(`machines/${machine.id}`).remove();
        
        // Heartbeat verisini sil
        await db.ref(`heartbeat/${machine.id}`).remove();
        
        // Telemetry verisini sil
        await db.ref(`machines/${machine.id}/telemetry`).remove();
        
        // Device status verisini sil
        await db.ref(`machines/${machine.id}/deviceStatus`).remove();
        
        deletedCount++;
        deletedMachines.push({
          id: machine.id,
          name: machine.name,
          model: machine.model
        });
        
        console.log(`✅ Silindi: ${machine.name}`);
        
      } catch (error) {
        console.error(`❌ Silinirken hata: ${machine.name} - ${error.message}`);
      }
    }
    
    console.log(`🎉 Temizleme tamamlandı! Silinen: ${deletedCount}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test makineleri başarıyla temizlendi!',
        stats: {
          totalMachines: Object.keys(machines).length,
          testMachines: testMachines.length,
          realMachines: realMachines.length,
          deletedMachines: deletedCount
        },
        deletedMachines: deletedMachines,
        remainingMachines: realMachines.map(m => ({
          id: m.id,
          name: m.name,
          model: m.model
        }))
      })
    };
    
  } catch (error) {
    console.error('❌ Test makineleri temizlenirken hata:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Test makineleri temizlenirken hata oluştu',
        message: error.message
      })
    };
  }
};
