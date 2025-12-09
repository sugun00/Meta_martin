/**
 * Math Lens - Son İşlenen Fotoğraf Yönetimi
 * AsyncStorage kullanarak en son analiz edilen fotoğrafı takip eder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LastProcessedInfo } from '../types';

const STORAGE_KEY = 'math_lens_last_processed_photo';

/**
 * Son işlenen fotoğraf bilgisini AsyncStorage'dan okur
 * @returns Son işlenen fotoğraf bilgisi veya null
 */
export async function getLastProcessedPhotoInfo(): Promise<LastProcessedInfo | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (jsonValue === null) {
      console.log('📦 Son işlenen fotoğraf bilgisi bulunamadı');
      return null;
    }
    
    const info: LastProcessedInfo = JSON.parse(jsonValue);
    console.log('📦 Son işlenen fotoğraf:', info.photoId);
    return info;
  } catch (error) {
    console.error('❌ Son işlenen fotoğraf okunurken hata:', error);
    return null;
  }
}

/**
 * Son işlenen fotoğraf bilgisini AsyncStorage'a kaydeder
 * @param photoId - Fotoğraf ID'si
 * @param filename - Dosya adı (opsiyonel)
 */
export async function setLastProcessedPhotoInfo(
  photoId: string,
  filename?: string
): Promise<boolean> {
  try {
    const info: LastProcessedInfo = {
      photoId,
      processedAt: Date.now(),
      filename,
    };
    
    const jsonValue = JSON.stringify(info);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    
    console.log('✅ Son işlenen fotoğraf kaydedildi:', photoId);
    return true;
  } catch (error) {
    console.error('❌ Son işlenen fotoğraf kaydedilirken hata:', error);
    return false;
  }
}

/**
 * Son işlenen fotoğraf bilgisini siler (test/debug için)
 */
export async function clearLastProcessedPhotoInfo(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Son işlenen fotoğraf bilgisi silindi');
    return true;
  } catch (error) {
    console.error('❌ Son işlenen fotoğraf silinirken hata:', error);
    return false;
  }
}

/**
 * Verilen fotoğrafın daha önce işlenip işlenmediğini kontrol eder
 * @param photoId - Kontrol edilecek fotoğraf ID'si
 * @returns Daha önce işlenmişse true
 */
export async function isPhotoAlreadyProcessed(photoId: string): Promise<boolean> {
  const lastProcessed = await getLastProcessedPhotoInfo();
  
  if (!lastProcessed) {
    return false;
  }
  
  return lastProcessed.photoId === photoId;
}

