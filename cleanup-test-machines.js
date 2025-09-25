/**
 * Test Makinelerini Temizleme Script'i
 * Bu script Firebase'deki test makinelerini bulur ve siler
 */

const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlat
if (!admin.apps.length) {
  try {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const databaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://dogus-otomat-telemetri-sistemi-default-rtdb.europe-west1.firebasedatabase.app/';
    
    if (credentialsJson) {
      const serviceAccount = JSON.parse(credentialsJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseUrl
      });
    } else {
      admin.initializeApp({
        databaseURL: databaseUrl
      });
    }
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    process.exit(1);
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

/**
 * Test makinelerini bul ve sil
 */
async function cleanupTestMachines() {
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
      console.log('✅ Temizlenecek test makinesi bulunamadı!');
      return;
    }
    
    // Test makinelerini listele
    console.log('\n📋 Test makineleri:');
    testMachines.forEach((machine, index) => {
      console.log(`${index + 1}. ${machine.name} (${machine.id}) - ${machine.model}`);
    });
    
    // Gerçek makineleri listele
    if (realMachines.length > 0) {
      console.log('\n✅ Korunacak gerçek makineler:');
      realMachines.forEach((machine, index) => {
        console.log(`${index + 1}. ${machine.name} (${machine.id}) - ${machine.model}`);
      });
    }
    
    // Onay iste
    console.log('\n⚠️  Bu işlem geri alınamaz!');
    console.log(`🗑️  ${testMachines.length} test makinesi silinecek.`);
    
    // Test makinelerini sil
    let deletedCount = 0;
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
        console.log(`✅ Silindi: ${machine.name}`);
        
      } catch (error) {
        console.error(`❌ Silinirken hata: ${machine.name} - ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Temizleme tamamlandı!`);
    console.log(`✅ Silinen test makinesi: ${deletedCount}`);
    console.log(`✅ Korunan gerçek makine: ${realMachines.length}`);
    
  } catch (error) {
    console.error('❌ Test makineleri temizlenirken hata:', error);
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log('🚀 Test Makinelerini Temizleme Script\'i Başlatılıyor...\n');
  
  await cleanupTestMachines();
  
  console.log('\n✅ Script tamamlandı!');
  process.exit(0);
}

// Script'i çalıştır
main().catch(error => {
  console.error('❌ Script hatası:', error);
  process.exit(1);
});
