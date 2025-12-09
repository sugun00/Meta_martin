/**
 * Math Lens - Backend API Servisi
 * Node.js backend ile iletişim kurar
 */

import { AnalyzeResult, ApiError } from '../types';

// Backend URL'sini .env'den al veya varsayılan değer kullan
const getBackendUrl = (): string => {
  // React Native'de @env modülü build time'da çözümlenir
  // Geliştirme sırasında direkt değer de kullanılabilir
  try {
    // @ts-ignore - env değişkeni runtime'da mevcut olmayabilir
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (envUrl) return envUrl;
  } catch {}
  
  // Varsayılan: localhost (iOS Simulator için)
  // Gerçek cihazda .env dosyasında IP adresini belirtin
  return 'http://localhost:3000';
};

/**
 * Fotoğrafı backend'e gönderir ve analiz sonucunu alır
 * @param photoUri - Fotoğrafın yerel URI'si
 * @param backendUrl - Backend URL (opsiyonel, config'den alınır)
 * @returns Analiz sonucu
 */
export async function analyzeImage(
  photoUri: string,
  backendUrl?: string
): Promise<AnalyzeResult> {
  const url = backendUrl || getBackendUrl();
  const endpoint = `${url}/analyze-image`;
  
  console.log('🔄 Fotoğraf analiz ediliyor...');
  console.log(`   📍 Endpoint: ${endpoint}`);
  console.log(`   📸 Fotoğraf: ${photoUri}`);
  
  try {
    // FormData oluştur
    const formData = new FormData();
    
    // React Native'de URI'den dosya bilgisini çıkar
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // FormData'ya dosyayı ekle
    // React Native'de fetch + FormData ile dosya gönderimi
    formData.append('image', {
      uri: photoUri,
      name: filename,
      type: type,
    } as any);
    
    console.log(`   📁 Dosya: ${filename} (${type})`);
    
    // Fetch isteği
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      // Content-Type'ı fetch'in otomatik ayarlamasına izin ver
      // (multipart/form-data boundary için gerekli)
    });
    
    // Yanıtı kontrol et
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend hatası:', response.status, errorText);
      
      return {
        success: false,
        error: `Backend hatası: ${response.status} - ${errorText}`,
      };
    }
    
    // JSON yanıtı parse et
    const result: AnalyzeResult = await response.json();
    
    console.log('✅ Analiz tamamlandı');
    console.log(`   📊 Tip: ${result.type || 'belirtilmemiş'}`);
    console.log(`   🎯 Sonuç: ${result.final_answer || 'yok'}`);
    
    return result;
  } catch (error) {
    console.error('❌ Analiz hatası:', error);
    
    // Ağ hatası mı kontrol et
    if (error instanceof TypeError && error.message.includes('Network')) {
      return {
        success: false,
        error: 'Ağ bağlantısı hatası. Backend sunucusunun çalıştığından ve IP adresinin doğru olduğundan emin olun.',
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
    };
  }
}

/**
 * Backend sağlık durumunu kontrol eder
 * @param backendUrl - Backend URL (opsiyonel)
 * @returns Sunucu çalışıyor mu
 */
export async function checkBackendHealth(backendUrl?: string): Promise<boolean> {
  const url = backendUrl || getBackendUrl();
  
  try {
    console.log('🏥 Backend sağlık kontrolü...', url);
    
    // AbortController ile timeout (10 saniye)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Backend çalışıyor');
      return true;
    }
    
    console.log('⚠️ Backend yanıt verdi ama hatalı:', response.status);
    return false;
  } catch (error) {
    console.error('❌ Backend bağlantı hatası:', error);
    return false;
  }
}

/**
 * API hatasını kullanıcı dostu mesaja çevirir
 */
export function formatApiError(error: string): string {
  if (error.includes('Network') || error.includes('fetch')) {
    return '🌐 Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
  }
  
  if (error.includes('timeout') || error.includes('Timeout')) {
    return '⏱️ Sunucu yanıt vermedi. Lütfen tekrar deneyin.';
  }
  
  if (error.includes('500')) {
    return '🔧 Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
  }
  
  if (error.includes('404')) {
    return '🔍 Analiz servisi bulunamadı. Backend yapılandırmasını kontrol edin.';
  }
  
  return `⚠️ ${error}`;
}

