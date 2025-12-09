/**
 * Math Lens - Uygulama Yapılandırması
 */

import { AppConfig } from '../types';

// Varsayılan yapılandırma
export const DEFAULT_CONFIG: AppConfig = {
  // Backend sunucu adresi
  // iOS Simulator için: http://localhost:3000
  // Gerçek cihaz için: http://192.168.x.x:3000
  backendUrl: 'http://localhost:3000',
  
  // Ray-Ban / Meta gözlük fotoğraflarının düştüğü albüm adı
  // Boş bırakılırsa genel Camera Roll'dan çeker
  // Olası değerler: "Ray-Ban", "Ray-Ban Stories", "Meta", "Camera Roll"
  targetAlbumName: '',
  
  // Yeni fotoğraf bulunduğunda otomatik analiz başlat
  autoAnalyze: false,
  
  // Sesli okuma özelliğini aktifleştir
  enableSpeech: true,
};

/**
 * Runtime'da yapılandırmayı güncelle
 */
let currentConfig: AppConfig = { ...DEFAULT_CONFIG };

export function getConfig(): AppConfig {
  return currentConfig;
}

export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  currentConfig = { ...currentConfig, ...updates };
  return currentConfig;
}

export function resetConfig(): AppConfig {
  currentConfig = { ...DEFAULT_CONFIG };
  return currentConfig;
}

