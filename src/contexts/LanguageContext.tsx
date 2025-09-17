import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'tr' | 'en';
export type Currency = 'TRY' | 'USD' | 'EUR';

interface LanguageContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation dictionary
const translations = {
  tr: {
    // Navigation
    'nav.dashboard': 'Ana Panel',
    'nav.machines': 'Makineler',
    'nav.products': 'Ürünler',
    'nav.reports': 'Raporlar',
    'nav.alarms': 'Alarmlar',
    'nav.operations': 'Operasyonlar',
    'nav.users': 'Kullanıcılar',
    
    // Dashboard
    'dashboard.title': 'Ana Panel',
    'dashboard.totalMachines': 'Toplam Makine',
    'dashboard.onlineMachines': 'Çevrimiçi Makine',
    'dashboard.activeAlarms': 'Aktif Alarm',
    'dashboard.todaySales': 'Bugünkü Satış',
    'dashboard.salesTrend': 'Satış Trendi',
    'dashboard.recentAlarms': 'Son Alarmlar',
    'dashboard.noSalesData': 'Satış verisi mevcut değil',
    'dashboard.salesDataDesc': 'İşlemler kaydedildiğinde satış verileri burada görünecek',
    'dashboard.noRecentAlarms': 'Yakın zamanda alarm yok',
    'dashboard.systemsRunning': 'Tüm sistemler sorunsuz çalışıyor',
    'dashboard.dailySales': 'Günlük Satış Özeti',
    
    // Machines
    'machines.title': 'Makine Yönetimi',
    'machines.refresh': 'Yenile',
    'machines.addMachine': 'Makine Ekle',
    'machines.onlineMachines': 'Çevrimiçi Makineler',
    'machines.offlineMachines': 'Çevrimdışı Makineler',
    'machines.totalMachines': 'Toplam Makineler',
    'machines.serialNumber': 'Seri Numarası',
    'machines.name': 'Ad',
    'machines.type': 'Tip',
    'machines.location': 'Konum',
    'machines.status': 'Durum',
    'machines.lastSeen': 'Son Görülme',
    'machines.actions': 'İşlemler',
    'machines.editTooltip': 'Makineyi Düzenle',
    'machines.deleteTooltip': 'Makineyi Sil',
    'machines.noMachines': 'Makine bulunamadı. Başlamak için ilk makinenizi ekleyin.',
    'machines.developmentMode': 'Geliştirme Modu:',
    'machines.developmentModeDesc': 'Her makine için ek test butonları mevcuttur. Heartbeat simüle edebilir, çevrimdışı uyarıları test edebilir, test hataları oluşturabilir ve e-posta bildirimlerini test edebilirsiniz.',
    
    // Alarms
    'alarms.title': 'Alarm Yönetimi',
    'alarms.refresh': 'Yenile',
    'alarms.activeAlarms': 'Aktif Alarmlar',
    'alarms.criticalAlarms': 'Kritik Alarmlar',
    'alarms.resolvedToday': 'Bugün Çözülen',
    'alarms.severity': 'Önem',
    'alarms.machine': 'Makine',
    'alarms.type': 'Tip',
    'alarms.code': 'Kod',
    'alarms.message': 'Mesaj',
    'alarms.status': 'Durum',
    'alarms.timestamp': 'Zaman Damgası',
    'alarms.actions': 'İşlemler',
    'alarms.viewDetails': 'Detayları Görüntüle',
    'alarms.acknowledge': 'Onayla',
    'alarms.resolve': 'Çöz',
    'alarms.noAlarms': 'Mevcut filtrelere uygun alarm bulunamadı.',
    
    // Products
    'products.title': 'Ürün Yönetimi',
    'products.addProduct': 'Ürün Ekle',
    'products.editProduct': 'Ürün Düzenle',
    'products.manageProducts': 'Ürünleri Yönet',
    'products.description': 'Kapsamlı ürün yönetimi sistemi. Kategoriler, tedarikçiler, fiyatlandırma, envanter takibi ve toplu işlemler ile tüm ürün yönetimi özelliklerine buradan erişebilirsiniz.',
    'products.importRealData': 'Mevcut Ürün Verilerini İçe Aktar',
    'products.exportData': 'Verileri Dışa Aktar',
    'products.perfume': 'Parfüm',
    'products.perfumeCategory': 'Parfüm Kategorisi',
    'products.search': 'Ara',
    'products.searchProducts': 'Ürün Ara...',
    'products.categoryFilter': 'Kategori Filtresi',
    'products.supplierFilter': 'Tedarikçi Filtresi',
    'products.allCategories': 'Tüm Kategoriler',
    'products.allSuppliers': 'Tüm Tedarikçiler',
    'products.totalProducts': 'Toplam Ürün',
    'products.activeProducts': 'Aktif Ürünler',
    'products.totalCategories': 'Toplam Kategori',
    'products.totalSuppliers': 'Toplam Tedarikçi',
    'products.categories': 'Kategoriler',
    'products.suppliers': 'Tedarikçiler',
    'products.productCode': 'Ürün Kodu',
    'products.name': 'Ad',
    'products.productName': 'Ürün Adı',
    'products.barcode': 'Barkod',
    'products.category': 'Kategori',
    'products.supplier': 'Tedarikçi',
    'products.costPrice': 'Maliyet Fiyatı',
    'products.sellPrice': 'Satış Fiyatı',
    'products.weight': 'Ağırlık',
    'products.volume': 'Hacim',
    'products.status': 'Durum',
    'products.actions': 'İşlemler',
    'products.edit': 'Düzenle',
    'products.delete': 'Sil',
    'products.active': 'Aktif',
    'products.inactive': 'Pasif',
    'products.basicInfo': 'Temel Bilgiler',
    'products.fieldDescription': 'Açıklama',
    'products.pricingInventory': 'Fiyatlandırma ve Envanter',
    'products.minStockLevel': 'Minimum Stok Seviyesi',
    'products.physicalProperties': 'Fiziksel Özellikler',
    'products.activeProduct': 'Aktif Ürün',
    'products.addSuccess': 'Ürün başarıyla eklendi',
    'products.updateSuccess': 'Ürün başarıyla güncellendi',
    'products.deleteSuccess': 'Ürün başarıyla silindi',
    'products.deleteConfirm': 'Bu ürünü silmek istediğinizden emin misiniz?',
    'products.exportSuccess': 'Ürünler başarıyla dışa aktarıldı',
    'products.importSuccess': 'Başarıyla {count} ürün içe aktarıldı',
    'products.importWarning': 'Içe aktarma hatalarla tamamlandı',
    'products.dataImportOptions': 'Veri İçe Aktarma Seçenekleri',
    'products.importDescription': 'Standart ürünleri içe aktarın veya mevcut commodity list verilerini taşıyın',
    
    // Reports
    'reports.title': 'Raporlar ve Analitik',
    'reports.exportReport': 'Rapor Dışa Aktar',
    'reports.description': 'Raporlama işlevselliği burada uygulanacak. Bu, günlük, haftalık, aylık ve yıllık satış raporlarını ve hata raporlarını içerecek.',
    
    // Operations
    'operations.title': 'Operasyon Yönetimi',
    'operations.addOperation': 'Operasyon Ekle',
    'operations.description': 'Operasyon yönetimi işlevselliği burada uygulanacak. Bu, dolum takibi, temizlik kayıtları ve bakım kayıtlarını içerecek.',
    'operations.slotTotalQuantity': 'Slottaki Toplam Adet',
    'operations.slotQuantityHelper': 'Bu slotta bulunan toplam ürün adedi',
    'operations.productTypeOptional': 'Ürün Türü (İsteğe Bağlı)',
    'operations.iceCreamDetails': 'Dondurma Otomatı Detayları',
    'operations.basicMaterials': 'Temel Malzemeler',
    'operations.sauceDetails': 'Sos Detayları',
    'operations.decorationAccessories': 'Süsleme ve Aksesuarlar',
    'operations.reserveProducts': 'Yedek Bırakılan Ürünler',
    'operations.chocolateSauce': 'Çikolata Sos (adet)',
    'operations.caramelSauce': 'Karamel Sos (adet)',
    'operations.strawberrySauce': 'Çilek Sos (adet)',
    'operations.sprinkles': 'Renkli Tanecikler',
    'operations.nuts': 'Fındık/Fıstık',
    'operations.waferCones': 'Wafer Koni Adedi',
    'operations.plasticSpoons': 'Plastik Kaşık (adet)',
    'operations.napkins': 'Peçete (adet)',
    'operations.iceCreamReserve': 'Dondurma Yedeği',
    'operations.sauceReserve': 'Sos Yedeği',
    'operations.decorationReserve': 'Süsleme Yedeği',
    'operations.otherReserve': 'Diğer Yedekler',
    
    // Users
    'users.title': 'Kullanıcı Yönetimi',
    'users.addUser': 'Kullanıcı Ekle',
    'users.addSubAccount': 'Alt Hesap Ekle',
    'users.editUser': 'Kullanıcıyı Düzenle',
    'users.deleteUser': 'Kullanıcıyı Sil',
    'users.name': 'Ad',
    'users.email': 'E-posta',
    'users.role': 'Rol',
    'users.status': 'Durum',
    'users.actions': 'İşlemler',
    
    // User roles
    'roles.admin': 'Yönetici',
    'roles.user': 'Kullanıcı',
    'roles.operator': 'Operatör',
    'roles.viewer': 'Görüntüleyici',
    
    // Account types
    'accountTypes.main': 'Ana Hesap',
    'accountTypes.sub': 'Alt Hesap',
    'users.active': 'Aktif',
    'users.inactive': 'Pasif',
    'users.subAccount': 'Alt Hesap',
    'users.parentAccount': 'Ana Hesap',
    'users.assignedMachines': 'Atanan Makineler',
    'users.assignedGroups': 'Atanan Gruplar',
    'users.machineAccess': 'Makine Erişimi',
    'users.groupAccess': 'Grup Erişimi',
    'users.permissions': 'İzinler',
    'users.createAccount': 'Hesap Oluştur',
    'users.accountCreated': 'Hesap başarıyla oluşturuldu',
    'users.accountUpdated': 'Hesap başarıyla güncellendi',
    'users.accountDeleted': 'Hesap başarıyla silindi',
    'users.confirmDelete': 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
    'users.noUsers': 'Kullanıcı bulunamadı',
    'users.userDetails': 'Kullanıcı Detayları',
    'users.accountType': 'Hesap Tipi',
    'users.mainAccount': 'Ana Hesap',
    'users.password': 'Şifre',
    'users.confirmPassword': 'Şifre Onayı',
    'users.passwordMismatch': 'Şifreler eşleşmiyor',
    'users.description': 'Kullanıcı yönetimi işlevselliği burada uygulanacak. Bu, kullanıcı ayarları, rol yönetimi ve izin kontrollerini içerecek.',
    
    // Common
    'common.welcome': 'Hoş geldiniz',
    'common.settings': 'Ayarlar',
    'common.logout': 'Çıkış Yap',
    'common.language': 'Dil',
    'common.currency': 'Para Birimi',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.userRequired': 'Kullanıcı girişi gerekli',
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.close': 'Kapat',
    'common.import': 'İçe Aktar',
    'common.export': 'Dışa Aktar',
    'common.sampleData': 'Örnek Veri',
    'common.online': 'Çevrimiçi',
    'common.offline': 'Çevrimdışı',
    'common.active': 'Aktif',
    'common.inactive': 'Pasif',
    'common.processing': 'İşleniyor...',
    'common.pleaseWait': 'Lütfen bekleyin...',
    'common.operationCompleted': 'İşlem tamamlandı',
    'common.operationFailed': 'İşlem başarısız oldu',
    
    // App Branding
    'app.telemetryDashboard': 'Telemetri Panosu',
    'app.telemetrySystem': 'Telemetri Sistemi',
    
    // Status
    'status.all': 'Tümü',
    'status.active': 'Aktif',
    'status.acknowledged': 'Onaylandı',
    'status.resolved': 'Çözüldü',
    'status.pending': 'Bekliyor',
    
    // Severity
    'severity.all': 'Tüm Önem Seviyeleri',
    'severity.critical': 'Kritik',
    'severity.high': 'Yüksek',
    'severity.medium': 'Orta',
    'severity.low': 'Düşük',
    
    // Commodity List Translations
    'commodityList.title': 'Firma Ürün Listeleri',
    'commodityList.pageDescription': 'Her firmanın kendi ürün listesini oluşturabileceği ve yönetebileceği bölüm',
    'commodityList.createList': 'Yeni Liste Oluştur',
    'commodityList.selectList': 'Bir Liste Seçin',
    'commodityList.deleteList': 'Listeyi Sil',
    'commodityList.addItem': 'Ürün Ekle',
    'commodityList.editItem': 'Ürünü Düzenle',
    'commodityList.listName': 'Liste Adı',
    'commodityList.commodityCode': 'Ürün Kodu',
    'commodityList.productName': 'Ürün Adı',
    'commodityList.supplier': 'Tedarikçi',
    'commodityList.type': 'Tür',
    'commodityList.unitPrice': 'Birim Fiyat',
    'commodityList.costPrice': 'Maliyet',
    'commodityList.specs': 'Özellikler',
    'commodityList.description': 'Açıklama',
    'commodityList.actions': 'İşlemler',
    'commodityList.items': 'ürün',
    'commodityList.totalLists': 'Toplam Liste',
    'commodityList.itemsInSelectedList': 'Seçili Listede Ürün',
    'commodityList.totalItems': 'Toplam Ürün',
    'commodityList.noListSelected': 'Hiçbir liste seçilmedi',
    'commodityList.selectOrCreateList': 'Devam etmek için bir liste seçin veya yeni bir liste oluşturun',
    'commodityList.createSuccess': 'Ürün listesi başarıyla oluşturuldu',
    'commodityList.deleteSuccess': 'Ürün listesi başarıyla silindi',
    'commodityList.deleteConfirm': 'Bu ürün listesini silmek istediğinizden emin misiniz?',
    'commodityList.itemAddSuccess': 'Ürün başarıyla eklendi',
    'commodityList.itemUpdateSuccess': 'Ürün başarıyla güncellendi',
    'commodityList.itemDeleteSuccess': 'Ürün başarıyla silindi',
    'commodityList.itemDeleteConfirm': 'Bu ürünü silmek istediğinizden emin misiniz?',
    'commodityList.selectListFirst': 'Devam etmek için önce bir liste seçin',
    'commodityList.importFromFile': 'Dosyadan İçe Aktar',
    'commodityList.importFileDescription': 'JSON formatında ürün listesi dosyası seçin',
    'commodityList.importSuccess': '{count} ürün başarıyla içe aktarıldı',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.machines': 'Machines',
    'nav.products': 'Products',
    'nav.reports': 'Reports',
    'nav.alarms': 'Alarms',
    'nav.operations': 'Operations',
    'nav.users': 'Users',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalMachines': 'Total Machines',
    'dashboard.onlineMachines': 'Online Machines',
    'dashboard.activeAlarms': 'Active Alarms',
    'dashboard.todaySales': 'Today\'s Sales',
    'dashboard.salesTrend': 'Sales Trend',
    'dashboard.recentAlarms': 'Recent Alarms',
    'dashboard.noSalesData': 'No sales data available',
    'dashboard.salesDataDesc': 'Sales data will appear here once transactions are recorded',
    'dashboard.noRecentAlarms': 'No recent alarms',
    'dashboard.systemsRunning': 'All systems are running smoothly',
    'dashboard.dailySales': 'Daily Sales Summary',
    
    // Machines
    'machines.title': 'Machine Management',
    'machines.refresh': 'Refresh',
    'machines.addMachine': 'Add Machine',
    'machines.onlineMachines': 'Online Machines',
    'machines.offlineMachines': 'Offline Machines',
    'machines.totalMachines': 'Total Machines',
    'machines.serialNumber': 'Serial Number',
    'machines.name': 'Name',
    'machines.type': 'Type',
    'machines.location': 'Location',
    'machines.status': 'Status',
    'machines.lastSeen': 'Last Seen',
    'machines.actions': 'Actions',
    'machines.editTooltip': 'Edit Machine',
    'machines.deleteTooltip': 'Delete Machine',
    'machines.noMachines': 'No machines found. Add your first machine to get started.',
    'machines.developmentMode': 'Development Mode:',
    'machines.developmentModeDesc': 'Additional testing buttons are available for each machine. You can simulate heartbeats, test offline alerts, create test errors, and test email notifications.',
    
    // Alarms
    'alarms.title': 'Alarm Management',
    'alarms.refresh': 'Refresh',
    'alarms.activeAlarms': 'Active Alarms',
    'alarms.criticalAlarms': 'Critical Alarms',
    'alarms.resolvedToday': 'Resolved Today',
    'alarms.severity': 'Severity',
    'alarms.machine': 'Machine',
    'alarms.type': 'Type',
    'alarms.code': 'Code',
    'alarms.message': 'Message',
    'alarms.status': 'Status',
    'alarms.timestamp': 'Timestamp',
    'alarms.actions': 'Actions',
    'alarms.viewDetails': 'View Details',
    'alarms.acknowledge': 'Acknowledge',
    'alarms.resolve': 'Resolve',
    'alarms.noAlarms': 'No alarms found matching the current filters.',
    
    // Products
    'products.title': 'Product Management',
    'products.addProduct': 'Add Product',
    'products.editProduct': 'Edit Product',
    'products.manageProducts': 'Manage Products',
    'products.description': 'Comprehensive product management with categories, suppliers, pricing, inventory tracking, and bulk operations. Click here to access all product management features.',
    'products.importRealData': 'Import Current Product Data',
    'products.exportData': 'Export Data',
    'products.search': 'Search',
    'products.searchProducts': 'Search products...',
    'products.categoryFilter': 'Category Filter',
    'products.supplierFilter': 'Supplier Filter',
    'products.allCategories': 'All Categories',
    'products.allSuppliers': 'All Suppliers',
    'products.totalProducts': 'Total Products',
    'products.activeProducts': 'Active Products',
    'products.totalCategories': 'Total Categories',
    'products.totalSuppliers': 'Total Suppliers',
    'products.categories': 'Categories',
    'products.suppliers': 'Suppliers',
    'products.productCode': 'Product Code',
    'products.name': 'Name',
    'products.productName': 'Product Name',
    'products.barcode': 'Barkod',
    'products.category': 'Kategori',
    'products.supplier': 'Tedarikçi',
    'products.costPrice': 'Maliyet Fiyatı',
    'products.sellPrice': 'Satış Fiyatı',
    'products.weight': 'Ağırlık',
    'products.volume': 'Hacim',
    'products.status': 'Durum',
    'products.actions': 'İşlemler',
    'products.edit': 'Düzenle',
    'products.delete': 'Sil',
    'products.active': 'Aktif',
    'products.inactive': 'Pasif',
    'products.basicInfo': 'Temel Bilgiler',
    'products.fieldDescription': 'Açıklama',
    'products.pricingInventory': 'Fiyatlandırma ve Stok',
    'products.minStockLevel': 'Minimum Stok Seviyesi',
    'products.physicalProperties': 'Fiziksel Özellikler',
    'products.activeProduct': 'Aktif Ürün',
    'products.addSuccess': 'Ürün başarıyla eklendi',
    'products.updateSuccess': 'Ürün başarıyla güncellendi',
    'products.deleteSuccess': 'Ürün başarıyla silindi',
    'products.deleteConfirm': 'Bu ürünü silmek istediğinizden emin misiniz?',
    'products.exportSuccess': 'Ürünler başarıyla dışa aktarıldı',
    'products.importSuccess': '{count} ürün başarıyla içe aktarıldı',
    'products.importWarning': 'İçe aktarma hatalarla tamamlandı',
    'products.dataImportOptions': 'Veri İçe Aktarma Seçenekleri',
    'products.importDescription': 'Standart ürünleri içe aktarın veya mevcut ürün listesi verilerini taşıyın',
    
    // Reports
    'reports.title': 'Raporlar ve Analitik',
    'reports.exportReport': 'Raporu Dışa Aktar',
    'reports.description': 'Raporlama işlevselliği burada uygulanacak. Bu, günlük, haftalık, aylık ve yıllık satış raporlarını ve hata raporlarını içerecek.',
    
    // Operations
    'operations.title': 'Operasyon Yönetimi',
    'operations.addOperation': 'Operasyon Ekle',
    'operations.description': 'Operasyon yönetimi işlevselliği burada uygulanacak. Bu, dolum takibi, temizlik kayıtları ve bakım kayıtlarını içerecek.',
    'operations.slotTotalQuantity': 'Slottaki Toplam Adet',
    'operations.slotQuantityHelper': 'Bu slotta bulunan toplam ürün adedi',
    'operations.productTypeOptional': 'Ürün Türü (İsteğe Bağlı)',
    'operations.iceCreamDetails': 'Dondurma Otomatı Detayları',
    'operations.basicMaterials': 'Temel Malzemeler',
    'operations.sauceDetails': 'Sos Detayları',
    'operations.decorationAccessories': 'Süsleme ve Aksesuarlar',
    'operations.reserveProducts': 'Yedek Bırakılan Ürünler',
    'operations.chocolateSauce': 'Çikolata Sos (adet)',
    'operations.caramelSauce': 'Karamel Sos (adet)',
    'operations.strawberrySauce': 'Çilek Sos (adet)',
    'operations.sprinkles': 'Renkli Tanecikler',
    'operations.nuts': 'Fındık/Fıstık',
    'operations.waferCones': 'Wafer Koni Adedi',
    'operations.plasticSpoons': 'Plastik Kaşık (adet)',
    'operations.napkins': 'Peçete (adet)',
    'operations.iceCreamReserve': 'Dondurma Yedeği',
    'operations.sauceReserve': 'Sos Yedeği',
    'operations.decorationReserve': 'Süsleme Yedeği',
    'operations.otherReserve': 'Diğer Yedekler',
    
    // Users
    'users.title': 'Kullanıcı Yönetimi',
    'users.addUser': 'Kullanıcı Ekle',
    'users.addSubAccount': 'Alt Hesap Ekle',
    'users.editUser': 'Kullanıcıyı Düzenle',
    'users.deleteUser': 'Kullanıcıyı Sil',
    'users.name': 'Ad',
    'users.email': 'E-posta',
    'users.role': 'Rol',
    'users.status': 'Durum',
    'users.actions': 'İşlemler',
    
    // User roles
    'roles.admin': 'Yönetici',
    'roles.user': 'Kullanıcı',
    'roles.operator': 'Operatör',
    'roles.viewer': 'Görüntüleyici',
    
    // Hesap türleri
    'accountTypes.main': 'Ana Hesap',
    'accountTypes.sub': 'Alt Hesap',
    'users.active': 'Aktif',
    'users.inactive': 'Pasif',
    'users.subAccount': 'Alt Hesap',
    'users.parentAccount': 'Ana Hesap',
    'users.assignedMachines': 'Atanan Makineler',
    'users.assignedGroups': 'Atanan Gruplar',
    'users.machineAccess': 'Makine Erişimi',
    'users.groupAccess': 'Grup Erişimi',
    'users.permissions': 'İzinler',
    'users.createAccount': 'Hesap Oluştur',
    'users.accountCreated': 'Hesap başarıyla oluşturuldu',
    'users.accountUpdated': 'Hesap başarıyla güncellendi',
    'users.accountDeleted': 'Hesap başarıyla silindi',
    'users.confirmDelete': 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
    'users.noUsers': 'Kullanıcı bulunamadı',
    'users.userDetails': 'Kullanıcı Detayları',
    'users.accountType': 'Hesap Tipi',
    'users.mainAccount': 'Ana Hesap',
    'users.password': 'Şifre',
    'users.confirmPassword': 'Şifre Onayı',
    'users.passwordMismatch': 'Şifreler eşleşmiyor',
    'users.description': 'Kullanıcı yönetimi işlevselliği burada uygulanacak. Bu, kullanıcı ayarları, rol yönetimi ve izin kontrollerini içerecek.',
    
    // Common
    'common.welcome': 'Hoş geldiniz',
    'common.settings': 'Ayarlar',
    'common.logout': 'Çıkış Yap',
    'common.language': 'Dil',
    'common.currency': 'Para Birimi',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.userRequired': 'Kullanıcı girişi gerekli',
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.close': 'Kapat',
    'common.import': 'İçe Aktar',
    'common.export': 'Dışa Aktar',
    'common.sampleData': 'Örnek Veri',
    'common.online': 'Çevrimiçi',
    'common.offline': 'Çevrimdışı',
    'common.active': 'Aktif',
    'common.inactive': 'Pasif',
    'common.processing': 'İşleniyor...',
    'common.pleaseWait': 'Lütfen bekleyin...',
    'common.operationCompleted': 'İşlem tamamlandı',
    'common.operationFailed': 'İşlem başarısız',
    
    // Uygulama Markası
    'app.telemetryDashboard': 'Telemetri Paneli',
    'app.telemetrySystem': 'Telemetri Sistemi',
    
    // Status
    'status.all': 'Tüm Durumlar',
    'status.active': 'Aktif',
    'status.acknowledged': 'Onaylandı',
    'status.resolved': 'Çözüldü',
    'status.pending': 'Beklemede',
    
    // Önem Derecesi
    'severity.all': 'Tüm Önem Dereceleri',
    'severity.critical': 'Kritik',
    'severity.high': 'Yüksek',
    'severity.medium': 'Orta',
    'severity.low': 'Düşük',
    
    // Ürün Listesi Çevirileri
    'commodityList.title': 'Şirket Ürün Listeleri',
    'commodityList.pageDescription': 'Her şirketin kendi ürün listelerini oluşturabileceği ve yönetebileceği bölüm',
    'commodityList.createList': 'Yeni Liste Oluştur',
    'commodityList.selectList': 'Liste Seç',
    'commodityList.deleteList': 'Listeyi Sil',
    'commodityList.addItem': 'Ürün Ekle',
    'commodityList.editItem': 'Ürünü Düzenle',
    'commodityList.listName': 'Liste Adı',
    'commodityList.commodityCode': 'Ürün Kodu',
    'commodityList.productName': 'Ürün Adı',
    'commodityList.supplier': 'Tedarikçi',
    'commodityList.type': 'Tip',
    'commodityList.unitPrice': 'Birim Fiyat',
    'commodityList.costPrice': 'Maliyet Fiyatı',
    'commodityList.specs': 'Özellikler',
    'commodityList.description': 'Açıklama',
    'commodityList.actions': 'İşlemler',
    'commodityList.items': 'ürün',
    'commodityList.totalLists': 'Toplam Liste',
    'commodityList.itemsInSelectedList': 'Seçili Listede Ürünler',
    'commodityList.totalItems': 'Toplam Ürün',
    'commodityList.noListSelected': 'Liste seçilmedi',
    'commodityList.selectOrCreateList': 'Devam etmek için bir liste seçin veya yeni bir liste oluşturun',
    'commodityList.createSuccess': 'Ürün listesi başarıyla oluşturuldu',
    'commodityList.deleteSuccess': 'Ürün listesi başarıyla silindi',
    'commodityList.deleteConfirm': 'Bu ürün listesini silmek istediğinizden emin misiniz?',
    'commodityList.itemAddSuccess': 'Ürün başarıyla eklendi',
    'commodityList.itemUpdateSuccess': 'Ürün başarıyla güncellendi',
    'commodityList.itemDeleteSuccess': 'Ürün başarıyla silindi',
    'commodityList.itemDeleteConfirm': 'Bu ürünü silmek istediğinizden emin misiniz?',
    'commodityList.selectListFirst': 'Devam etmek için lütfen önce bir liste seçin',
    'commodityList.importFromFile': 'Dosyadan İçe Aktar',
    'commodityList.importFileDescription': 'JSON formatında bir ürün listesi dosyası seçin',
    'commodityList.importSuccess': '{count} ürün başarıyla içe aktarıldı',
  }
};

// Currency symbols and formatting
const currencyConfig = {
  TRY: { symbol: '₺', locale: 'tr-TR' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr');
  const [currency, setCurrencyState] = useState<Currency>('TRY');

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    const savedCurrency = localStorage.getItem('currency') as Currency;
    
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
    
    if (savedCurrency && currencyConfig[savedCurrency]) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('currency', curr);
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  const formatCurrency = (amount: number): string => {
    const config = currencyConfig[currency];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const value: LanguageContextType = {
    language,
    currency,
    setLanguage,
    setCurrency,
    t,
    formatCurrency
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};