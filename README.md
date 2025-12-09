# 🔮 Math Lens - AI Gözlük Asistanı

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-51.0.0-4630EB.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.74.5-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-3178C6.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Ray-Ban / Meta akıllı gözlüklerle çekilen fotoğrafları yapay zeka ile analiz eden React Native / Expo mobil uygulaması.**

[Kurulum](#-kurulum) •
[Kullanım](#-çalışma-akışı) •
[Backend API](#-backend-api-gereksinimleri) •
[Sorun Giderme](#-sorun-giderme-troubleshooting) •
[Yol Haritası](#-yol-haritası-roadmap)

</div>

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Sistem Mimarisi](#-sistem-mimarisi-akış-diyagramı)
- [Tech Stack & Versiyonlar](#-tech-stack--versiyonlar)
- [Gereksinimler](#-gereksinimler)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri (.env)](#-ortam-değişkenleri-env)
- [Backend API Gereksinimleri](#-backend-api-gereksinimleri)
- [Proje Yapısı](#-proje-yapısı)
- [Yapılandırma](#-yapılandırma)
- [Çalışma Akışı](#-çalışma-akışı)
- [Test Senaryoları](#-test-senaryoları)
- [Sorun Giderme](#-sorun-giderme-troubleshooting)
- [Bilinen Sınırlamalar](#-bilinen-sınırlamalar-known-issues)
- [Güvenlik Notları](#-güvenlik-notları)
- [Yol Haritası](#-yol-haritası-roadmap)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

---

## 📱 Özellikler

| Özellik | Açıklama | Durum |
|---------|----------|-------|
| 📸 **Otomatik Fotoğraf Algılama** | Galerideki en son fotoğrafı otomatik bulur | ✅ |
| 🧠 **AI Analiz** | Fotoğrafı backend'e gönderip matematik/metin analizi yapar | ✅ |
| 🔊 **Sesli Okuma** | Sonucu Türkçe olarak sesli okur (expo-speech) | ✅ |
| 💾 **Akıllı Cache** | Daha önce işlenen fotoğrafları hatırlar (AsyncStorage) | ✅ |
| 📁 **Albüm Filtreleme** | Belirli bir albümden (örn: Ray-Ban) fotoğraf çekebilir | ✅ |
| 🌙 **Modern UI** | Koyu tema, sade ve şık arayüz | ✅ |
| ⚙️ **Uygulama İçi Ayarlar** | Backend URL ve albüm ayarları | ✅ |
| 🔄 **Pull-to-Refresh** | Aşağı çekerek yeni fotoğrafları tara | ✅ |

---

## 🔄 Sistem Mimarisi (Akış Diyagramı)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MATH LENS - ÇALIŞMA AKIŞI                            │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   📷 SMART   │     │  📱 TELEFON  │     │ 📲 MATH LENS │     │  🖥️ BACKEND │
  │   GLASSES    │     │   GALERİSİ   │     │   UYGULAMA   │     │   SUNUCU    │
  │  (Ray-Ban)   │     │              │     │              │     │  (Node.js)  │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
         │                    │                    │                    │
         │  1. Fotoğraf çek   │                    │                    │
         │ ──────────────────>│                    │                    │
         │                    │                    │                    │
         │                    │  2. Galeri izni    │                    │
         │                    │<───────────────────│                    │
         │                    │                    │                    │
         │                    │  3. Son fotoğrafı  │                    │
         │                    │     getir          │                    │
         │                    │<───────────────────│                    │
         │                    │                    │                    │
         │                    │  4. Fotoğraf URI   │                    │
         │                    │──────────────────> │                    │
         │                    │                    │                    │
         │                    │                    │  5. POST /analyze  │
         │                    │                    │     (multipart)    │
         │                    │                    │ ──────────────────>│
         │                    │                    │                    │
         │                    │                    │                    │ 6. AI Analiz
         │                    │                    │                    │    (OpenAI/
         │                    │                    │                    │     Claude)
         │                    │                    │                    │
         │                    │                    │  7. JSON Response  │
         │                    │                    │<────────────────── │
         │                    │                    │                    │
         │                    │                    │  8. Sonucu göster  │
         │                    │                    │     + Sesli oku    │
         │                    │                    │                    │
  └──────┴───────┘     └──────┴───────┘     └──────┴───────┘     └──────┴───────┘
```

### Detaylı Akış

```
Kullanıcı                    Math Lens App                     Backend
   │                              │                               │
   │  Uygulamayı aç               │                               │
   │ ──────────────────────────>  │                               │
   │                              │                               │
   │                              │  ── İzin kontrolü ──>         │
   │                              │  <── İzin verildi ───         │
   │                              │                               │
   │                              │  ── GET /health ──────────>   │
   │                              │  <── { ok: true } ────────    │
   │                              │                               │
   │                              │  ── Galeriyi tara ──>         │
   │                              │  <── Son fotoğraf ───         │
   │                              │                               │
   │  "Analiz Et" butonuna bas    │                               │
   │ ──────────────────────────>  │                               │
   │                              │                               │
   │                              │  ── POST /analyze-image ──>   │
   │                              │     (FormData: image)         │
   │                              │                               │
   │                              │  <── JSON: steps, answer ──   │
   │                              │                               │
   │  <── Sonucu ekranda gör ──   │                               │
   │                              │                               │
   │  "Sesli Oku" butonuna bas    │                               │
   │ ──────────────────────────>  │                               │
   │                              │                               │
   │  <── TTS ile dinle ───────   │                               │
   │                              │                               │
```

---

## 🛠️ Tech Stack & Versiyonlar

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **Expo SDK** | ~51.0.0 | React Native geliştirme platformu |
| **React Native** | 0.74.5 | Mobil uygulama framework'ü |
| **React** | 18.2.0 | UI kütüphanesi |
| **TypeScript** | ^5.3.0 | Tip güvenli JavaScript |
| **expo-media-library** | ~16.0.0 | Galeri erişimi |
| **expo-speech** | ~12.0.0 | Text-to-Speech |
| **@react-native-async-storage** | 1.23.1 | Yerel depolama |

---

## 📋 Gereksinimler

### Geliştirme Ortamı

| Gereksinim | Minimum Versiyon | Önerilen |
|------------|------------------|----------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| Expo CLI | - | En güncel |
| Git | 2.0.0 | En güncel |

### Mobil Test Ortamı (birini seçin)

- 📱 **Fiziksel Cihaz** (önerilir) + Expo Go uygulaması
- 🍎 **iOS Simulator** (macOS gerektirir, Xcode)
- 🤖 **Android Emulator** (Android Studio)

### Backend Gereksinimleri

- ✅ Çalışan Node.js backend sunucusu
- ✅ `/analyze-image` endpoint'i (multipart/form-data)
- ✅ `/health` endpoint'i
- ✅ CORS etkin
- ✅ Aynı WiFi ağında erişilebilir IP adresi

---

## 📦 Kurulum

### 1. Projeyi Klonla

```bash
git clone <repository-url>
cd Meta_martin
```

### 2. Bağımlılıkları Yükle

```bash
# npm ile
npm install

# veya yarn ile
yarn install
```

### 3. Ortam Değişkenlerini Ayarla

```bash
# Örnek dosyayı kopyala
cp env.example.txt .env

# .env dosyasını düzenle
nano .env  # veya tercih ettiğiniz editör
```

### 4. Asset Dosyalarını Hazırla (Opsiyonel)

```bash
# assets/ klasörüne icon.png, splash.png ekleyin
# Detaylar: assets/README.md
```

### 5. Uygulamayı Başlat

```bash
# Expo development server
npx expo start

# Direkt iOS'ta aç
npx expo start --ios

# Direkt Android'de aç
npx expo start --android

# Expo Go ile QR kod tara
npx expo start --tunnel  # Farklı ağlarda test için
```

### 6. IP Adresinizi Bulun

Backend URL için bilgisayarınızın yerel IP adresine ihtiyacınız var:

```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows (PowerShell)
ipconfig | findstr IPv4

# Linux
hostname -I | awk '{print $1}'
```

---

## ⚙️ Ortam Değişkenleri (.env)

Proje kök dizininde `.env` dosyası oluşturun:

```env
# ═══════════════════════════════════════════════════════════════
# MATH LENS - ORTAM DEĞİŞKENLERİ
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────
# 🔗 BACKEND SUNUCU ADRESİ (ZORUNLU)
# ─────────────────────────────────────────────────────────────────
# Fiziksel cihazda test için localhost ÇALIŞMAZ!
# Bilgisayarınızın yerel IP adresini kullanın.
#
# Örnek: http://192.168.1.100:3000
# Örnek: http://10.0.0.50:3000
#
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000

# ─────────────────────────────────────────────────────────────────
# 📁 HEDEF ALBÜM ADI (OPSİYONEL)
# ─────────────────────────────────────────────────────────────────
# Ray-Ban/Meta gözlük fotoğraflarının düştüğü albüm.
# Boş bırakırsanız tüm galeriden son fotoğrafı alır.
#
# Olası değerler:
#   - Ray-Ban
#   - Ray-Ban Stories
#   - Meta
#   - Camera Roll
#   - (boş = tüm galeri)
#
EXPO_PUBLIC_TARGET_ALBUM=

# ─────────────────────────────────────────────────────────────────
# 🤖 OTOMATİK ANALİZ (OPSİYONEL)
# ─────────────────────────────────────────────────────────────────
# true: Yeni fotoğraf bulunduğunda otomatik analiz başlat
# false: Kullanıcı "Analiz Et" butonuna bassın
#
EXPO_PUBLIC_AUTO_ANALYZE=false

# ─────────────────────────────────────────────────────────────────
# 🔊 SESLİ OKUMA (OPSİYONEL)
# ─────────────────────────────────────────────────────────────────
# true: Sesli okuma özelliği aktif
# false: Sesli okuma devre dışı
#
EXPO_PUBLIC_ENABLE_SPEECH=true
```

### Değişkenlerin Özeti

| Değişken | Zorunlu | Varsayılan | Açıklama |
|----------|---------|------------|----------|
| `EXPO_PUBLIC_BACKEND_URL` | ✅ Evet | `http://192.168.1.100:3000` | Backend sunucu adresi |
| `EXPO_PUBLIC_TARGET_ALBUM` | ❌ Hayır | (boş) | Hedef albüm adı |
| `EXPO_PUBLIC_AUTO_ANALYZE` | ❌ Hayır | `false` | Otomatik analiz |
| `EXPO_PUBLIC_ENABLE_SPEECH` | ❌ Hayır | `true` | Sesli okuma |

---

## 🔌 Backend API Gereksinimleri

Math Lens uygulamasının çalışması için backend sunucunuzun aşağıdaki gereksinimleri karşılaması gerekir:

### Minimum API Spesifikasyonu

#### 1. CORS Yapılandırması

```javascript
// Express.js örneği
const cors = require('cors');

app.use(cors({
  origin: '*', // Geliştirme için - prod'da kısıtlayın
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
```

#### 2. POST `/analyze-image`

Fotoğrafı analiz eder ve sonuç döndürür.

**Request:**
```
Method: POST
Content-Type: multipart/form-data
Body:
  - image: <file> (JPEG, PNG - maks. 10 MB önerilir)
```

**Response (Başarılı):**
```json
{
  "success": true,
  "type": "math",
  "steps": [
    "1. Denklemi düzenle: 2x + 4 = 10",
    "2. Her iki taraftan 4 çıkar: 2x = 6",
    "3. Her iki tarafı 2'ye böl: x = 3"
  ],
  "final_answer": "x = 3",
  "raw_model_response": "..."
}
```

**Response (Hata):**
```json
{
  "success": false,
  "error": "Görüntü analiz edilemedi"
}
```

**Type Değerleri:**
- `math` - Matematik problemi
- `text` - Metin/yazı
- `other` - Diğer içerik

#### 3. GET `/health`

Sunucu sağlık kontrolü.

**Response:**
```json
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Örnek curl Komutları

#### Backend Sağlık Kontrolü
```bash
curl -X GET http://192.168.1.100:3000/health
```

#### Fotoğraf Analizi
```bash
curl -X POST http://192.168.1.100:3000/analyze-image \
  -F "image=@/path/to/photo.jpg" \
  -H "Content-Type: multipart/form-data"
```

### Görüntü Boyut Sınırlamaları

| Parametre | Önerilen | Maksimum |
|-----------|----------|----------|
| Dosya boyutu | 2-5 MB | 10 MB |
| Çözünürlük | 1920x1080 | 4096x4096 |
| Format | JPEG, PNG | JPEG, PNG, HEIC |

> ⚠️ **Not**: Çok büyük dosyalar yükleme süresini ve API maliyetini artırır.

---

## 📂 Proje Yapısı

```
Meta_martin/
│
├── 📄 App.tsx                    # Ana uygulama bileşeni (UI + state)
├── 📄 app.json                   # Expo yapılandırması
├── 📄 package.json               # Bağımlılıklar ve script'ler
├── 📄 tsconfig.json              # TypeScript yapılandırması
├── 📄 babel.config.js            # Babel yapılandırması
├── 📄 env.example.txt            # Örnek ortam değişkenleri
├── 📄 README.md                  # Bu dosya
├── 📄 .gitignore                 # Git ignore kuralları
│
├── 📁 src/
│   │
│   ├── 📁 types/
│   │   ├── 📄 index.ts           # TypeScript tip tanımları
│   │   └── 📄 env.d.ts           # Ortam değişkenleri tipleri
│   │
│   ├── 📁 services/
│   │   ├── 📄 api.ts             # Backend API servisi
│   │   │                         # - analyzeImage()
│   │   │                         # - checkBackendHealth()
│   │   │                         # - formatApiError()
│   │   │
│   │   └── 📄 media.ts           # Medya kütüphanesi servisi
│   │                             # - requestMediaPermissions()
│   │                             # - getLatestPhoto()
│   │                             # - findAlbumByName()
│   │
│   ├── 📁 storage/
│   │   └── 📄 lastProcessed.ts   # AsyncStorage yardımcıları
│   │                             # - getLastProcessedPhotoInfo()
│   │                             # - setLastProcessedPhotoInfo()
│   │                             # - isPhotoAlreadyProcessed()
│   │
│   ├── 📁 config/
│   │   └── 📄 index.ts           # Uygulama yapılandırması
│   │                             # - DEFAULT_CONFIG
│   │                             # - getConfig() / updateConfig()
│   │
│   └── 📁 components/
│       └── 📄 ResultCard.tsx     # Sonuç kartı bileşeni
│                                 # - Fotoğraf önizleme
│                                 # - Çözüm adımları
│                                 # - Sesli okuma butonu
│
└── 📁 assets/
    └── 📄 README.md              # Asset dosyaları açıklaması
```

---

## 🔧 Yapılandırma

### Backend URL Ayarlama

**Yöntem 1: `.env` dosyası** (önerilir)
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000
```

**Yöntem 2: Uygulama içi ayarlar**
1. Uygulamada ⚙️ ikonuna tıklayın
2. "Backend URL" alanına adresi girin
3. "Kaydet" butonuna basın

### Hedef Albüm Ayarlama

Ray-Ban/Meta gözlükler fotoğrafları özel albümlere kaydedebilir:

| Albüm Adı | Platform | Açıklama |
|-----------|----------|----------|
| `Ray-Ban` | iOS/Android | Ray-Ban Stories albümü |
| `Ray-Ban Stories` | iOS/Android | Alternatif isim |
| `Meta` | iOS/Android | Meta View albümü |
| (boş) | - | Tüm galeriden son fotoğraf |

---

## 🔄 Çalışma Akışı

### 1. Uygulama Açılışı
```
┌─────────────────────────────────────┐
│  📱 Uygulama başlatılıyor...        │
│  ┌─────────────────────────────┐    │
│  │ 1. Galeri izni isteniyor    │    │
│  │ 2. Backend bağlantısı test  │    │
│  │ 3. Son fotoğraf taranıyor   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 2. Yeni Fotoğraf Bulunduğunda
- ✨ Fotoğraf önizlemesi gösterilir
- 🆕 "YENİ" etiketi eklenir
- 🚀 "Fotoğrafı Analiz Et" butonu aktif olur

### 3. Analiz Süreci
- 📤 Fotoğraf backend'e FormData ile gönderilir
- ⏳ Loading göstergesi çıkar
- 📥 Sonuç geldiğinde ResultCard ile gösterilir

### 4. Sonuç Gösterimi
- 📊 Analiz tipi (Matematik/Metin/Diğer)
- 📋 Çözüm adımları (numaralı liste)
- 🎯 Final sonuç (vurgulu)
- 🔊 Sesli okuma butonu

---

## 🎨 Ekran Görüntüleri

```
┌─────────────────────────────────┐
│  🔮 Math Lens                ⚙️ │
│     AI Gözlük Asistanı          │
├─────────────────────────────────┤
│  ● Sunucu bağlı                 │
├─────────────────────────────────┤
│  ✨ Yeni fotoğraf analiz        │
│     için hazır!                 │
├─────────────────────────────────┤
│  📸 Son Fotoğraf    5 dk önce   │
│  ┌───────────────────────┐      │
│  │                       │ YENİ │
│  │      [Fotoğraf]       │      │
│  │                       │      │
│  └───────────────────────┘      │
│  IMG_0123.jpg                   │
│                                 │
│  ┌───────────────────────┐      │
│  │  🚀 Fotoğrafı Analiz  │      │
│  └───────────────────────┘      │
├─────────────────────────────────┤
│  ✨ Analiz Sonucu    📐 Math    │
│  ┌───────────────────────┐      │
│  │ 📋 Çözüm Adımları     │      │
│  │ ① Denklemi düzenle    │      │
│  │ ② Her iki taraftan 4  │      │
│  │    çıkar              │      │
│  │ ③ x değerini bul      │      │
│  └───────────────────────┘      │
│                                 │
│  🎯 Sonuç                       │
│  ┌───────────────────────┐      │
│  │        x = 3          │      │
│  └───────────────────────┘      │
│                                 │
│  ┌───────────────────────┐      │
│  │  🔊 Sonucu Sesli Oku  │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## 🧪 Test Senaryoları

Uygulamanın doğru çalıştığını doğrulamak için aşağıdaki testleri yapın:

### 1. Backend Bağlantı Testi

```bash
# Terminal'den backend'i test edin
curl -X GET http://YOUR_IP:3000/health

# Beklenen çıktı:
# {"ok":true}
```

**Uygulama içi kontrol:**
- Uygulamayı açın
- Üstte "● Sunucu bağlı" yazısını görün
- Kırmızı nokta görüyorsanız bağlantı yok

### 2. Galeri İzin Testi

| Adım | Beklenen Sonuç |
|------|----------------|
| Uygulamayı ilk kez aç | İzin popup'ı çıkar |
| "İzin Ver" seç | Ana ekran açılır |
| "Reddet" seç | "Galeri Erişimi Gerekli" ekranı |

### 3. Yeni Fotoğraf Algılama Testi

| Adım | Beklenen Sonuç |
|------|----------------|
| Galeride yeni fotoğraf yok | "Yeni fotoğraf bulunamadı" |
| Yeni fotoğraf ekle | "YENİ" etiketi görünür |
| Aşağı çek (refresh) | Yeni fotoğraf taranır |

### 4. Analiz Testi

| Adım | Beklenen Sonuç |
|------|----------------|
| "Analiz Et" butonuna bas | Loading göstergesi |
| Backend yanıt verir | ResultCard görünür |
| Backend hata verir | Hata mesajı görünür |

### 5. Sesli Okuma Testi

| Adım | Beklenen Sonuç |
|------|----------------|
| "Sesli Oku" butonuna bas | Türkçe TTS başlar |
| Tekrar bas | TTS durur |
| Telefon sessizde | Ses çıkmaz (normal) |

### Hızlı Test Checklist

```
□ Backend /health endpoint'i yanıt veriyor
□ Uygulama "Sunucu bağlı" gösteriyor
□ Galeri izni alınabiliyor
□ Son fotoğraf görüntüleniyor
□ "YENİ" etiketi doğru çalışıyor
□ Analiz başarılı sonuç döndürüyor
□ Sonuç kartı düzgün görüntüleniyor
□ Sesli okuma çalışıyor
□ Pull-to-refresh çalışıyor
□ Ayarlar menüsü açılıyor
```

---

## 🐛 Sorun Giderme (Troubleshooting)

### ❌ "Sunucu bağlantısı yok" Hatası

**Olası Nedenler ve Çözümler:**

| Neden | Çözüm |
|-------|-------|
| Backend çalışmıyor | `node server.js` veya `npm start` ile başlatın |
| Yanlış IP adresi | `ifconfig` / `ipconfig` ile doğru IP'yi bulun |
| Farklı WiFi ağı | Telefon ve bilgisayar aynı ağda olmalı |
| Firewall engeli | Port 3000'i açın veya firewall'u geçici kapatın |
| localhost kullanımı | Fiziksel cihazda localhost çalışmaz |

**Adım adım kontrol:**
```bash
# 1. Backend'in çalıştığını doğrula
curl http://localhost:3000/health

# 2. IP adresini bul
ifconfig | grep "inet " | grep -v 127.0.0.1

# 3. IP ile test et
curl http://192.168.1.XXX:3000/health

# 4. Telefondan aynı IP'ye erişimi test et
# Safari/Chrome'da http://192.168.1.XXX:3000/health aç
```

### ❌ "Galeri izni reddedildi" Hatası

**iOS:**
1. Ayarlar > Math Lens > Fotoğraflar
2. "Tüm Fotoğraflar" seçin

**Android:**
1. Ayarlar > Uygulamalar > Math Lens
2. İzinler > Depolama/Fotoğraflar > İzin Ver

### ❌ "Fotoğraf bulunamıyor" Hatası

| Neden | Çözüm |
|-------|-------|
| Galeri boş | Test için bir fotoğraf ekleyin |
| Yanlış albüm adı | Ayarlardan albüm adını kontrol edin |
| Cache sorunu | "Debug" butonuna basarak sıfırlayın |

### ❌ "Analiz başarısız" Hatası

| Neden | Çözüm |
|-------|-------|
| Dosya çok büyük | 10 MB altında fotoğraf kullanın |
| Backend hatası | Backend loglarını kontrol edin |
| Timeout | İnternet bağlantısını kontrol edin |
| AI limiti | API kotanızı kontrol edin |

### ❌ Sesli Okuma Çalışmıyor

| Neden | Çözüm |
|-------|-------|
| Telefon sessizde | Ses düğmesini açın |
| TTS dil paketi yok | Sistem ayarlarından Türkçe TTS indirin |
| expo-speech hatası | Uygulamayı yeniden başlatın |

### ❌ Expo Development Server Başlamıyor

```bash
# Cache temizle
npx expo start --clear

# Node modules yeniden yükle
rm -rf node_modules
npm install

# Expo CLI güncelle
npm install -g expo-cli
```

---

## ⚠️ Bilinen Sınırlamalar (Known Issues)

### Platform Kısıtlamaları

| Sınırlama | Platform | Açıklama |
|-----------|----------|----------|
| **Arka plan tarama yok** | iOS/Android | Uygulama kapalıyken fotoğraf taranamaz |
| **Sadece son fotoğraf** | Tümü | Şu an için sadece en son fotoğraf işlenir |
| **Manuel tetikleme** | Tümü | Otomatik analiz henüz varsayılan değil |

### AI/Analiz Sınırlamaları

| Sınırlama | Açıklama |
|-----------|----------|
| **Bulanık fotoğraflar** | AI düşük kaliteli görüntüleri okuyamayabilir |
| **Karanlık fotoğraflar** | Yetersiz aydınlatma doğruluğu düşürür |
| **El yazısı** | El yazısı metinlerde hata oranı yüksek |
| **Karmaşık formüller** | Çok karmaşık matematik ifadeleri sorunlu olabilir |
| **AI yanılgısı** | AI her zaman %100 doğru değildir |

### Teknik Sınırlamalar

| Sınırlama | Değer | Not |
|-----------|-------|-----|
| Maks. dosya boyutu | ~10 MB | Daha büyük dosyalar timeout alabilir |
| Desteklenen formatlar | JPEG, PNG | HEIC otomatik dönüştürülür |
| Offline çalışma | ❌ | Backend bağlantısı zorunlu |
| Çoklu fotoğraf | ❌ | Tek seferde bir fotoğraf |

### iOS Spesifik

- Background fetch API kısıtlıdır
- Fotoğraf erişimi için her seferinde izin gerekir (ilk kullanımda)
- HEIC formatı otomatik JPEG'e dönüştürülür

### Android Spesifik

- Android 13+ için yeni medya izinleri gerekir
- Bazı üreticilerde galeri erişimi farklı çalışabilir

---

## 🔒 Güvenlik Notları

### ⚠️ API Anahtarları

```
┌─────────────────────────────────────────────────────────────┐
│  🚨 KRİTİK: API KEY'LERİ MOBİL UYGULAMAYA KOYMAYIN!        │
└─────────────────────────────────────────────────────────────┘
```

**Yanlış ❌**
```javascript
// Mobil uygulama içinde
const OPENAI_KEY = "sk-xxxxxxxxxxxx";
```

**Doğru ✅**
```javascript
// API key'ler sadece backend'de
// Mobil uygulama sadece backend URL'ini bilir
const BACKEND_URL = "http://192.168.1.100:3000";
```

### Backend Güvenlik Önerileri

| Öneri | Açıklama |
|-------|----------|
| **Rate limiting** | DDoS koruması için istek sınırlama |
| **Input validation** | Yüklenen dosyaları doğrulama |
| **HTTPS** | Production'da SSL kullanın |
| **Authentication** | Gerekirse JWT/API key doğrulaması |
| **CORS kısıtlama** | Production'da origin'leri sınırlayın |
| **Log rotation** | Hassas verileri loglara yazmayın |

### Örnek Güvenli Backend Yapılandırması

```javascript
// Production için önerilen
app.use(cors({
  origin: ['https://yourdomain.com'],
  methods: ['POST'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 100 istek limiti
}));

// Dosya boyutu limiti
app.use(express.json({ limit: '10mb' }));
```

### Veri Gizliliği

- 📸 Fotoğraflar cihazda saklanır, backend'e sadece analiz için gönderilir
- 💾 AsyncStorage'da sadece fotoğraf ID'si saklanır, fotoğraf içeriği değil
- 🔄 Backend'e gönderilen fotoğraflar işlendikten sonra silinmelidir

---

## 🗺️ Yol Haritası (Roadmap)

### v1.1 - Yakın Gelecek
- [ ] 📷 **Fotoğraf Seçim Ekranı** - Son N fotoğraf arasından seçim
- [ ] 📜 **Analiz Geçmişi** - Önceki analizleri görüntüleme
- [ ] 🔔 **Push Notification** - Analiz tamamlandığında bildirim

### v1.2 - Orta Vadeli
- [ ] 🏷️ **Soru Tipi Filtreleme** - Matematik/Metin/Diğer filtreleri
- [ ] 📴 **Offline Cache** - Son analizleri offline görüntüleme
- [ ] ⚙️ **Gelişmiş Ayarlar** - Tema, dil, TTS hızı seçenekleri
- [ ] 📊 **İstatistikler** - Günlük/haftalık analiz sayısı

### v1.3 - Uzun Vadeli
- [ ] 🔄 **Arka Plan Senkronizasyon** - Otomatik fotoğraf tarama
- [ ] ☁️ **Bulut Yedekleme** - Analiz geçmişini senkronize etme
- [ ] 👥 **Çoklu Kullanıcı** - Aile/sınıf paylaşımı
- [ ] 🌐 **Çoklu Dil Desteği** - İngilizce, Almanca, vb.

### v2.0 - Vizyon
- [ ] 🎥 **Video Analizi** - Video karelerini analiz etme
- [ ] 🤖 **Canlı Kamera** - Gerçek zamanlı görüntü analizi
- [ ] 📝 **Not Defteri** - Analizleri düzenleme ve kaydetme
- [ ] 🔗 **Entegrasyonlar** - Notion, Google Drive, vb.

### Katkı Beklenen Alanlar

```
🟢 Yardım isteniyor:
├── UI/UX iyileştirmeleri
├── Erişilebilirlik (a11y) özellikleri
├── Test coverage artırma
├── Dokümantasyon çevirileri
└── Bug fix'ler
```

---

## 🤝 Katkıda Bulunma

Katkılarınız memnuniyetle karşılanır! 

### Nasıl Katkıda Bulunabilirsiniz

1. **Fork** edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add: AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. **Pull Request** açın

### Commit Mesaj Formatı

```
Type: Kısa açıklama

[opsiyonel gövde]

Types:
- Add: Yeni özellik
- Fix: Bug düzeltme
- Update: Mevcut özellik güncellemesi
- Refactor: Kod düzenleme
- Docs: Dokümantasyon
- Style: Stil/format değişikliği
- Test: Test ekleme/düzeltme
```

### Kod Standartları

- TypeScript strict mode
- ESLint kurallarına uyum
- Component'ler için fonksiyonel yaklaşım
- Her fonksiyona JSDoc yorumu

---

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.

```
MIT License

Copyright (c) 2024 Math Lens

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

## 🔮 Math Lens

**Akıllı gözlüklerinizden aldığınız fotoğrafları yapay zeka ile analiz edin!**

[⬆️ Başa Dön](#-math-lens---ai-gözlük-asistanı)

---

Made with ❤️ for smart glasses users

</div>
