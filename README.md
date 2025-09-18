# Doğuş Otomat Telemetri Sistemi

Modern otomat makineleri için web tabanlı yönetim paneli.

## 🚀 Ne Yapar?

Bu sistem sayesinde:
- Otomat makinelerinizi uzaktan izleyebilirsiniz
- Satış raporlarını görüntüleyebilirsiniz  
- Makine durumlarını kontrol edebilirsiniz
- Ürün stoklarını yönetebilirsiniz
- Alarmları takip edebilirsiniz

## 📱 Özellikler

### 🎯 Ana Özellikler
- **Canlı İzleme**: Makinelerinizi gerçek zamanlı takip edin
- **Satış Raporları**: Detaylı satış analizleri görün
- **Stok Yönetimi**: Ürün stoklarını kolayca yönetin
- **Alarm Sistemi**: Sorunları anında öğrenin
- **Kullanıcı Yönetimi**: Ekip üyelerinize farklı yetkiler verin

### 🌍 Dil Desteği
- 🇹🇷 Türkçe
- 🇺🇸 İngilizce

### 🌙 Görünüm
- ☀️ Açık tema
- 🌙 Koyu tema

## 🛠️ Teknolojiler

- **React** - Kullanıcı arayüzü
- **TypeScript** - Tip güvenliği
- **Material-UI** - Modern tasarım
- **Firebase** - Veritabanı ve kimlik doğrulama

## 📋 Gereksinimler

- Node.js (16.0 veya üstü)
- npm veya yarn
- Modern web tarayıcısı

## ⚡ Kurulum

### 1. Projeyi İndirin
```bash
git clone [proje-adresi]
cd "Doğuş Otomat Telemetri Sistemi v2"
```

### 2. Ortam Değişkenlerini Ayarlayın
Projeyi çalıştırmadan önce Firebase yapılandırmanızı ayarlamanız gerekir:

1. `.env.example` dosyasını kopyalayın ve `.env` olarak yeniden adlandırın:
   ```bash
   cp .env.example .env
   ```

2. `.env` dosyasını açın ve Firebase projenizden aldığınız bilgilerle doldurun:
   - Firebase Console > Proje Ayarları > Genel sekmesinden bilgileri alın

### 3. Bağımlılıkları Yükleyin
```bash
npm install
```

### 4. Projeyi Başlatın
```bash
npm start
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 👤 İlk Giriş

1. Sisteme ilk kez giriş yaptığınızda otomatik olarak **Yönetici** yetkisi alırsınız
2. E-posta ve şifrenizle giriş yapın
3. Ana panelden tüm özelliklere erişebilirsiniz

## 📊 Kullanım

### Makine Ekleme
1. **Makineler** sekmesine gidin
2. **Makine Ekle** butonuna tıklayın
3. Makine bilgilerini doldurun
4. Kaydedin

### Ürün Yönetimi
1. **Ürünler** sekmesine gidin
2. Farklı kategoriler için ayrı sekmeler kullanın:
   - Atıştırmalık/İçecek
   - Dondurma
   - Kahve  
   - Parfüm

### Raporlar
1. **Raporlar** sekmesine gidin
2. Tarih aralığı seçin
3. İstediğiniz raporu görüntüleyin

## 🔐 Güvenlik

- Tüm veriler şifrelenmiş olarak saklanır
- Kullanıcı yetkilendirmesi Firebase Authentication ile sağlanır
- Veritabanı erişimi güvenli kurallarla korunur

## 🆘 Sorun Giderme

### Giriş Yapamıyorum
- İnternet bağlantınızı kontrol edin
- E-posta ve şifrenizi doğru girdiğinizden emin olun
- Tarayıcı önbelleğini temizleyin

### Makineler Görünmüyor
- Firebase bağlantısını kontrol edin
- Yetkinizin olduğundan emin olun
- Sayfayı yenileyin

### Veriler Yüklenmiyor
- İnternet bağlantınızı kontrol edin
- Tarayıcı konsolunda hata mesajlarını kontrol edin
- Sayfayı yenileyin

## 📞 Destek

Teknik sorunlar için sistem yöneticinizle iletişime geçin.

## 📄 Lisans

Bu yazılım özel kullanım içindir.

---

**Not**: Bu sistem sadece yetkili kullanıcılar tarafından kullanılmalıdır. Sisteme yetkisiz erişim yasaktır.