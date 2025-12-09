/**
 * Math Lens - Medya Kütüphanesi Servisi
 * expo-media-library kullanarak galeriden fotoğraf okuma işlemleri
 * expo-image-picker ile kullanıcının galeriden fotoğraf seçmesi
 */

import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { PhotoInfo } from '../types';

/**
 * Galeri erişim izni ister
 * @returns İzin verilip verilmediği
 */
export async function requestMediaPermissions(): Promise<boolean> {
  try {
    console.log('🔐 Galeri izni isteniyor...');
    
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status === 'granted') {
      console.log('✅ Galeri izni verildi');
      return true;
    } else {
      console.log('❌ Galeri izni reddedildi');
      return false;
    }
  } catch (error) {
    console.error('❌ İzin istenirken hata:', error);
    return false;
  }
}

/**
 * Mevcut galeri izin durumunu kontrol eder
 * @returns İzin verilmiş mi
 */
export async function checkMediaPermissions(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ İzin kontrolü hatası:', error);
    return false;
  }
}

/**
 * Belirli bir albümü ismiyle arar
 * @param albumName - Aranacak albüm adı (örn: "Ray-Ban", "Ray-Ban Stories")
 * @returns Albüm veya null
 */
export async function findAlbumByName(albumName: string): Promise<MediaLibrary.Album | null> {
  try {
    console.log(`📁 Albüm aranıyor: "${albumName}"`);
    
    const albums = await MediaLibrary.getAlbumsAsync();
    const targetAlbum = albums.find(
      album => album.title.toLowerCase().includes(albumName.toLowerCase())
    );
    
    if (targetAlbum) {
      console.log(`✅ Albüm bulundu: ${targetAlbum.title} (${targetAlbum.assetCount} fotoğraf)`);
      return targetAlbum;
    }
    
    console.log(`⚠️ "${albumName}" albümü bulunamadı`);
    return null;
  } catch (error) {
    console.error('❌ Albüm aranırken hata:', error);
    return null;
  }
}

/**
 * Tüm albümleri listeler (debug için)
 */
export async function listAllAlbums(): Promise<MediaLibrary.Album[]> {
  try {
    const albums = await MediaLibrary.getAlbumsAsync();
    console.log('📚 Mevcut albümler:');
    albums.forEach(album => {
      console.log(`  - ${album.title}: ${album.assetCount} öğe`);
    });
    return albums;
  } catch (error) {
    console.error('❌ Albümler listelenirken hata:', error);
    return [];
  }
}

/**
 * Belirli bir albümden veya genel galeriden en son fotoğrafı getirir
 * @param albumName - Hedef albüm adı (opsiyonel, boşsa genel galeri)
 * @param count - Kaç fotoğraf getirileceği (varsayılan: 1)
 * @returns En son fotoğraf bilgisi veya null
 */
export async function getLatestPhoto(
  albumName?: string,
  count: number = 1
): Promise<PhotoInfo | null> {
  try {
    console.log('📸 En son fotoğraf aranıyor...');
    
    // Önce belirtilen albümü bulmayı dene
    let album: MediaLibrary.Album | null = null;
    
    if (albumName) {
      album = await findAlbumByName(albumName);
    }
    
    // Fotoğrafları getir
    const assetsQuery: MediaLibrary.AssetsOptions = {
      first: count,
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [MediaLibrary.SortBy.creationTime],
    };
    
    // Eğer albüm varsa sadece o albümden çek
    if (album) {
      assetsQuery.album = album;
    }
    
    const assets = await MediaLibrary.getAssetsAsync(assetsQuery);
    
    if (assets.assets.length === 0) {
      console.log('⚠️ Fotoğraf bulunamadı');
      return null;
    }
    
    const latestAsset = assets.assets[0];
    
    // Asset bilgisini genişlet (URI için gerekli)
    const assetInfo = await MediaLibrary.getAssetInfoAsync(latestAsset);
    
    const photoInfo: PhotoInfo = {
      id: latestAsset.id,
      uri: assetInfo.localUri || latestAsset.uri,
      filename: latestAsset.filename,
      creationTime: latestAsset.creationTime,
      width: latestAsset.width,
      height: latestAsset.height,
      mediaType: latestAsset.mediaType,
    };
    
    console.log('✅ En son fotoğraf bulundu:');
    console.log(`   📄 Dosya: ${photoInfo.filename}`);
    console.log(`   🕐 Tarih: ${new Date(photoInfo.creationTime).toLocaleString()}`);
    console.log(`   📐 Boyut: ${photoInfo.width}x${photoInfo.height}`);
    
    return photoInfo;
  } catch (error) {
    console.error('❌ Fotoğraf getirilirken hata:', error);
    return null;
  }
}

/**
 * Son N fotoğrafı getirir (thumbnail listesi için)
 * @param count - Kaç fotoğraf getirileceği
 * @param albumName - Hedef albüm adı (opsiyonel)
 * @returns Fotoğraf listesi
 */
export async function getRecentPhotos(
  count: number = 10,
  albumName?: string
): Promise<PhotoInfo[]> {
  try {
    let album: MediaLibrary.Album | null = null;
    
    if (albumName) {
      album = await findAlbumByName(albumName);
    }
    
    const assetsQuery: MediaLibrary.AssetsOptions = {
      first: count,
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [MediaLibrary.SortBy.creationTime],
    };
    
    if (album) {
      assetsQuery.album = album;
    }
    
    const assets = await MediaLibrary.getAssetsAsync(assetsQuery);
    
    const photos: PhotoInfo[] = await Promise.all(
      assets.assets.map(async (asset) => {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        return {
          id: asset.id,
          uri: assetInfo.localUri || asset.uri,
          filename: asset.filename,
          creationTime: asset.creationTime,
          width: asset.width,
          height: asset.height,
          mediaType: asset.mediaType,
        };
      })
    );
    
    return photos;
  } catch (error) {
    console.error('❌ Fotoğraflar getirilirken hata:', error);
    return [];
  }
}

/**
 * Fotoğraf tarihini okunabilir formata çevirir
 */
export function formatPhotoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return 'Az önce';
  } else if (diffMins < 60) {
    return `${diffMins} dakika önce`;
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`;
  } else if (diffDays < 7) {
    return `${diffDays} gün önce`;
  } else {
    return date.toLocaleDateString('tr-TR');
  }
}

/**
 * Kullanıcının galeriden fotoğraf seçmesini sağlar
 * @returns Seçilen fotoğraf bilgisi veya null (iptal edilirse)
 */
export async function pickImageFromGallery(): Promise<PhotoInfo | null> {
  try {
    console.log('🖼️ Galeri açılıyor...');
    
    // Galeri izni iste (ImagePicker için ayrı izin gerekebilir)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('❌ Galeri izni reddedildi');
      return null;
    }
    
    // Galeriyi aç ve kullanıcının seçim yapmasını bekle
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      exif: true,
    });
    
    // Kullanıcı iptal ettiyse
    if (result.canceled) {
      console.log('ℹ️ Kullanıcı fotoğraf seçimini iptal etti');
      return null;
    }
    
    const selectedImage = result.assets[0];
    
    // PhotoInfo formatına çevir
    const photoInfo: PhotoInfo = {
      id: `picked_${Date.now()}`, // Benzersiz ID oluştur
      uri: selectedImage.uri,
      filename: selectedImage.fileName || `photo_${Date.now()}.jpg`,
      creationTime: Date.now(), // Seçim zamanı
      width: selectedImage.width,
      height: selectedImage.height,
      mediaType: 'photo',
    };
    
    console.log('✅ Fotoğraf seçildi:');
    console.log(`   📄 Dosya: ${photoInfo.filename}`);
    console.log(`   📐 Boyut: ${photoInfo.width}x${photoInfo.height}`);
    console.log(`   🔗 URI: ${photoInfo.uri.substring(0, 50)}...`);
    
    return photoInfo;
  } catch (error) {
    console.error('❌ Fotoğraf seçilirken hata:', error);
    return null;
  }
}

/**
 * Kamera erişilebilir mi kontrol eder
 * @returns Kamera kullanılabilir mi
 */
export async function isCameraAvailable(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    // Simülatörde kamera yoktur ama izin sorulabilir
    return status === 'granted' || status === 'undetermined';
  } catch (error) {
    return false;
  }
}

/**
 * Kamera ile fotoğraf çeker
 * @returns Çekilen fotoğraf bilgisi veya null
 * @throws Error - Kamera erişilemezse veya izin reddedilirse
 */
export async function takePhotoWithCamera(): Promise<PhotoInfo | null> {
  console.log('📷 Kamera açılıyor...');
  
  // Önce kamera iznini kontrol et
  const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
  console.log(`📋 Mevcut kamera izni: ${existingStatus}`);
  
  let finalStatus = existingStatus;
  
  // İzin henüz sorulmadıysa sor
  if (existingStatus !== 'granted') {
    console.log('🔐 Kamera izni isteniyor...');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    finalStatus = status;
    console.log(`📋 Yeni kamera izni durumu: ${finalStatus}`);
  }
  
  if (finalStatus !== 'granted') {
    console.log('❌ Kamera izni reddedildi');
    throw new Error('CAMERA_PERMISSION_DENIED');
  }
  
  try {
    console.log('🎥 Kamera başlatılıyor...');
    
    // Kamerayı aç
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      exif: true,
      base64: false,
    });
    
    console.log('📸 Kamera sonucu:', result.canceled ? 'İptal edildi' : 'Fotoğraf çekildi');
    
    // Kullanıcı iptal ettiyse
    if (result.canceled) {
      console.log('ℹ️ Kullanıcı fotoğraf çekimini iptal etti');
      return null;
    }
    
    // Sonuç yoksa
    if (!result.assets || result.assets.length === 0) {
      console.log('⚠️ Fotoğraf verisi alınamadı');
      throw new Error('NO_IMAGE_DATA');
    }
    
    const capturedImage = result.assets[0];
    
    // PhotoInfo formatına çevir
    const photoInfo: PhotoInfo = {
      id: `camera_${Date.now()}`,
      uri: capturedImage.uri,
      filename: capturedImage.fileName || `camera_${Date.now()}.jpg`,
      creationTime: Date.now(),
      width: capturedImage.width || 0,
      height: capturedImage.height || 0,
      mediaType: 'photo',
    };
    
    console.log('✅ Fotoğraf başarıyla çekildi:');
    console.log(`   📄 Dosya: ${photoInfo.filename}`);
    console.log(`   📐 Boyut: ${photoInfo.width}x${photoInfo.height}`);
    console.log(`   🔗 URI: ${photoInfo.uri.substring(0, 60)}...`);
    
    return photoInfo;
  } catch (error: any) {
    console.error('❌ Kamera hatası:', error);
    
    // Simülatör hatası kontrolü
    if (error.message?.includes('simulator') || 
        error.message?.includes('Simulator') ||
        error.code === 'E_CAMERA_UNAVAILABLE') {
      throw new Error('CAMERA_NOT_AVAILABLE');
    }
    
    throw error;
  }
}

