/**
 * Math Lens - AI Gözlük Asistanı
 * Ray-Ban / Meta akıllı gözlüklerle çekilen fotoğrafları analiz eder
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
// Servisler
import { requestMediaPermissions, getLatestPhoto, formatPhotoDate, listAllAlbums, pickImageFromGallery, takePhotoWithCamera } from './src/services/media';
import { analyzeImage, formatApiError, checkBackendHealth } from './src/services/api';
import {
  getLastProcessedPhotoInfo,
  setLastProcessedPhotoInfo,
  isPhotoAlreadyProcessed,
  clearLastProcessedPhotoInfo,
} from './src/storage/lastProcessed';
import { getConfig, updateConfig } from './src/config';

// Bileşenler
import ResultCard from './src/components/ResultCard';

// Tipler
import { PhotoInfo, AnalyzeResult, AppStatus } from './src/types';

const { width: screenWidth } = Dimensions.get('window');

export default function App() {
  // State tanımlamaları
  const [status, setStatus] = useState<AppStatus>('idle');
  const [latestPhoto, setLatestPhoto] = useState<PhotoInfo | null>(null);
  const [isNewPhoto, setIsNewPhoto] = useState<boolean>(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  
  // Ayarlar modal
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [backendUrl, setBackendUrl] = useState<string>(getConfig().backendUrl);
  const [targetAlbum, setTargetAlbum] = useState<string>(getConfig().targetAlbumName);
  
  // Backend durumu
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  
  // Fotoğraf seçme modal
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState<boolean>(false);

  /**
   * Uygulama başlatıldığında
   */
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Uygulamayı başlat
   */
  const initializeApp = async () => {
    console.log('🚀 Math Lens başlatılıyor...');
    setStatus('loading_permissions');
    
    // Galeri izni iste
    const hasPermission = await requestMediaPermissions();
    setPermissionGranted(hasPermission);
    
    if (!hasPermission) {
      setStatus('permission_denied');
      return;
    }
    
    // Backend kontrolü (paralel)
    checkBackendHealth(backendUrl).then(setBackendOnline);
    
    // En son fotoğrafı tara
    await scanForNewPhotos();
  };

  /**
   * Yeni fotoğrafları tara
   */
  const scanForNewPhotos = async () => {
    setStatus('scanning_photos');
    console.log('🔍 Fotoğraflar taranıyor...');
    
    try {
      // Debug: Tüm albümleri listele
      await listAllAlbums();
      
      // En son fotoğrafı getir
      const config = getConfig();
      const photo = await getLatestPhoto(config.targetAlbumName || undefined);
      
      if (!photo) {
        setStatus('no_new_photo');
        setLatestPhoto(null);
        setIsNewPhoto(false);
        return;
      }
      
      setLatestPhoto(photo);
      
      // Daha önce işlenmiş mi kontrol et
      const alreadyProcessed = await isPhotoAlreadyProcessed(photo.id);
      setIsNewPhoto(!alreadyProcessed);
      
      if (alreadyProcessed) {
        console.log('ℹ️ Bu fotoğraf daha önce işlendi');
        setStatus('no_new_photo');
      } else {
        console.log('🆕 Yeni fotoğraf bulundu!');
        setStatus('photo_ready');
        
        // Otomatik analiz aktifse başlat
        if (config.autoAnalyze) {
          handleAnalyze();
        }
      }
    } catch (error) {
      console.error('❌ Tarama hatası:', error);
      setStatus('error');
    }
  };

  /**
   * Fotoğrafı analiz et
   */
  const handleAnalyze = async () => {
    if (!latestPhoto) {
      Alert.alert('Hata', 'Analiz edilecek fotoğraf bulunamadı.');
      return;
    }
    
    setStatus('analyzing');
    setAnalyzeResult(null);
    
    try {
      console.log('🔬 Analiz başlatılıyor...');
      
      const result = await analyzeImage(latestPhoto.uri, backendUrl);
      
      setAnalyzeResult(result);
      
      if (result.success) {
        // Başarılı analiz - fotoğrafı işlendi olarak kaydet
        await setLastProcessedPhotoInfo(latestPhoto.id, latestPhoto.filename);
        setIsNewPhoto(false);
        setStatus('analysis_complete');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('❌ Analiz hatası:', error);
      setAnalyzeResult({
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
      setStatus('error');
    }
  };

  /**
   * Sayfayı yenile
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setAnalyzeResult(null);
    
    // Backend durumunu kontrol et
    checkBackendHealth(backendUrl).then(setBackendOnline);
    
    await scanForNewPhotos();
    setRefreshing(false);
  }, [backendUrl]);

  /**
   * Ayarları kaydet
   */
  const saveSettings = () => {
    updateConfig({
      backendUrl: backendUrl,
      targetAlbumName: targetAlbum,
    });
    
    setShowSettings(false);
    
    // Backend durumunu yeniden kontrol et
    checkBackendHealth(backendUrl).then(setBackendOnline);
    
    Alert.alert('Başarılı', 'Ayarlar kaydedildi.');
  };

  /**
   * Son işlenen fotoğrafı sıfırla (debug)
   */
  const resetProcessedPhoto = async () => {
    await clearLastProcessedPhotoInfo();
    setIsNewPhoto(true);
    setStatus('photo_ready');
    Alert.alert('Sıfırlandı', 'Son işlenen fotoğraf bilgisi temizlendi.');
  };

  /**
   * Galeriden fotoğraf seç
   */
  const handlePickFromGallery = async () => {
    setShowPhotoPicker(false);
    setIsPickingPhoto(true);
    
    try {
      const photo = await pickImageFromGallery();
      
      if (photo) {
        setLatestPhoto(photo);
        setIsNewPhoto(true);
        setAnalyzeResult(null);
        setStatus('photo_ready');
        console.log('✅ Galeriden fotoğraf seçildi');
      }
    } catch (error) {
      console.error('❌ Fotoğraf seçme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    } finally {
      setIsPickingPhoto(false);
    }
  };

  /**
   * Kamera ile fotoğraf çek
   */
  const handleTakePhoto = async () => {
    setShowPhotoPicker(false);
    setIsPickingPhoto(true);
    
    try {
      const photo = await takePhotoWithCamera();
      
      if (photo) {
        setLatestPhoto(photo);
        setIsNewPhoto(true);
        setAnalyzeResult(null);
        setStatus('photo_ready');
        console.log('✅ Kamera ile fotoğraf çekildi');
      }
    } catch (error: any) {
      console.error('❌ Fotoğraf çekme hatası:', error);
      
      // Hata tipine göre mesaj göster
      if (error.message === 'CAMERA_PERMISSION_DENIED') {
        Alert.alert(
          'Kamera İzni Gerekli',
          'Fotoğraf çekmek için kamera erişim izni vermeniz gerekiyor. Lütfen ayarlardan izin verin.',
          [{ text: 'Tamam' }]
        );
      } else if (error.message === 'CAMERA_NOT_AVAILABLE') {
        Alert.alert(
          'Kamera Kullanılamıyor',
          'Kamera bu cihazda kullanılamıyor. iOS Simülatöründe kamera çalışmaz, gerçek bir cihaz kullanın veya galeriden fotoğraf seçin.',
          [{ text: 'Tamam' }]
        );
      } else if (error.message === 'NO_IMAGE_DATA') {
        Alert.alert(
          'Fotoğraf Alınamadı',
          'Fotoğraf verisi alınamadı. Lütfen tekrar deneyin.',
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert(
          'Hata',
          'Fotoğraf çekilirken bir hata oluştu. Lütfen tekrar deneyin.',
          [{ text: 'Tamam' }]
        );
      }
    } finally {
      setIsPickingPhoto(false);
    }
  };

  /**
   * Durum mesajını getir
   */
  const getStatusMessage = (): { icon: string; text: string; color: string } => {
    switch (status) {
      case 'loading_permissions':
        return { icon: '🔐', text: 'İzinler kontrol ediliyor...', color: '#FCD34D' };
      case 'permission_denied':
        return { icon: '⚠️', text: 'Galeri erişim izni gerekli', color: '#EF4444' };
      case 'scanning_photos':
        return { icon: '🔍', text: 'Fotoğraflar taranıyor...', color: '#60A5FA' };
      case 'no_new_photo':
        return { icon: '📷', text: 'Yeni fotoğraf bulunamadı', color: '#9CA3AF' };
      case 'photo_ready':
        return { icon: '✨', text: 'Yeni fotoğraf analiz için hazır!', color: '#4ADE80' };
      case 'analyzing':
        return { icon: '🧠', text: 'AI analiz yapıyor...', color: '#A78BFA' };
      case 'analysis_complete':
        return { icon: '✅', text: 'Analiz tamamlandı!', color: '#4ADE80' };
      case 'error':
        return { icon: '❌', text: 'Bir hata oluştu', color: '#EF4444' };
      default:
        return { icon: '📱', text: 'Hazır', color: '#9CA3AF' };
    }
  };

  const statusInfo = getStatusMessage();

  // İzin reddedildi ekranı
  if (status === 'permission_denied') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContainer}>
          <Text style={styles.permissionIcon}>🔒</Text>
          <Text style={styles.permissionTitle}>Galeri Erişimi Gerekli</Text>
          <Text style={styles.permissionText}>
            Math Lens'in çalışması için fotoğraf galerinize erişim izni vermeniz gerekiyor.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={initializeApp}>
            <Text style={styles.primaryButtonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.logo}>🔮</Text>
            <View style={styles.headerText}>
              <Text style={styles.title}>Math Lens</Text>
              <Text style={styles.subtitle}>AI Gözlük Asistanı</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        {/* Backend Durumu */}
        <View style={styles.backendStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: backendOnline === true ? '#4ADE80' : backendOnline === false ? '#EF4444' : '#9CA3AF' }
          ]} />
          <Text style={styles.backendStatusText}>
            {backendOnline === null ? 'Sunucu kontrol ediliyor...' :
             backendOnline ? 'Sunucu bağlı' : 'Sunucu bağlantısı yok'}
          </Text>
        </View>
        
        {/* Durum Kartı */}
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
          {status === 'analyzing' && (
            <ActivityIndicator size="small" color="#A78BFA" style={styles.statusLoader} />
          )}
        </View>
        
        {/* Fotoğraf Önizleme */}
        {latestPhoto && (
          <View style={styles.photoCard}>
            <View style={styles.photoHeader}>
              <Text style={styles.photoTitle}>📸 Son Fotoğraf</Text>
              <Text style={styles.photoDate}>
                {formatPhotoDate(latestPhoto.creationTime)}
              </Text>
            </View>
            
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: latestPhoto.uri }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
              
              {isNewPhoto && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>YENİ</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.photoFilename} numberOfLines={1}>
              {latestPhoto.filename}
            </Text>
            
            {/* Analiz Butonu */}
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                (status === 'analyzing' || !backendOnline) && styles.analyzeButtonDisabled
              ]}
              onPress={handleAnalyze}
              disabled={status === 'analyzing' || !backendOnline}
              activeOpacity={0.7}
            >
              {status === 'analyzing' ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analiz Ediliyor...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.analyzeButtonIcon}>🚀</Text>
                  <Text style={styles.analyzeButtonText}>Fotoğrafı Analiz Et</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Fotoğraf Bulunamadı */}
        {!latestPhoto && status !== 'scanning_photos' && status !== 'loading_permissions' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>Fotoğraf Bulunamadı</Text>
            <Text style={styles.emptyText}>
              Galerinizde fotoğraf yok veya hedef albüm bulunamadı.
              {'\n\n'}
              Akıllı gözlüğünüzle bir fotoğraf çekin ve sayfayı aşağı çekerek yenileyin.
            </Text>
          </View>
        )}
        
        {/* Analiz Sonucu */}
        {analyzeResult && latestPhoto && (
          <ResultCard
            photo={latestPhoto}
            result={analyzeResult}
          />
        )}
        
        {/* Debug Alanı */}
        {latestPhoto && !isNewPhoto && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={resetProcessedPhoto}
          >
            <Text style={styles.debugButtonText}>🔄 İşlenen Fotoğrafı Sıfırla (Debug)</Text>
          </TouchableOpacity>
        )}
        
        {/* Alt Bilgi */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Sayfayı aşağı çekerek yeni fotoğrafları tarayabilirsiniz
          </Text>
        </View>
      </ScrollView>
      
      {/* Floating Action Button - Fotoğraf Ekle */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowPhotoPicker(true)}
        activeOpacity={0.8}
        disabled={isPickingPhoto}
      >
        {isPickingPhoto ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.fabIcon}>📷</Text>
        )}
      </TouchableOpacity>
      
      {/* Fotoğraf Seçme Modal */}
      <Modal
        visible={showPhotoPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhotoPicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoPicker(false)}
        >
          <View style={styles.pickerContent}>
            <View style={styles.pickerHandle} />
            
            <Text style={styles.pickerTitle}>📸 Fotoğraf Ekle</Text>
            <Text style={styles.pickerSubtitle}>
              Analiz etmek istediğiniz fotoğrafı seçin
            </Text>
            
            <View style={styles.pickerButtons}>
              {/* Galeriden Seç */}
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handlePickFromGallery}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerButtonIcon, { backgroundColor: '#6366F1' }]}>
                  <Text style={styles.pickerButtonEmoji}>🖼️</Text>
                </View>
                <Text style={styles.pickerButtonText}>Galeriden Seç</Text>
                <Text style={styles.pickerButtonHint}>Mevcut fotoğraflardan seç</Text>
              </TouchableOpacity>
              
              {/* Kamera ile Çek */}
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerButtonIcon, { backgroundColor: '#4ADE80' }]}>
                  <Text style={styles.pickerButtonEmoji}>📷</Text>
                </View>
                <Text style={styles.pickerButtonText}>Fotoğraf Çek</Text>
                <Text style={styles.pickerButtonHint}>Kamerayı kullan</Text>
              </TouchableOpacity>
            </View>
            
            {/* İptal Butonu */}
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setShowPhotoPicker(false)}
            >
              <Text style={styles.pickerCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Ayarlar Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Ayarlar</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Backend URL</Text>
              <TextInput
                style={styles.settingInput}
                value={backendUrl}
                onChangeText={setBackendUrl}
                placeholder="http://192.168.1.100:3000"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.settingHint}>
                Bilgisayarınızın yerel IP adresini girin
              </Text>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Hedef Albüm (Opsiyonel)</Text>
              <TextInput
                style={styles.settingInput}
                value={targetAlbum}
                onChangeText={setTargetAlbum}
                placeholder="Ray-Ban, Camera Roll, vb."
                placeholderTextColor="#666"
              />
              <Text style={styles.settingHint}>
                Boş bırakırsanız tüm fotoğraflar taranır
              </Text>
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
              <Text style={styles.saveButtonText}>💾 Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    marginRight: 12,
  },
  headerText: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
  },
  settingsIcon: {
    fontSize: 24,
  },
  
  // Backend Status
  backendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  backendStatusText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  
  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  statusLoader: {
    marginLeft: 8,
  },
  
  // Photo Card
  photoCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoPreview: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4ADE80',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  photoFilename: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  
  // Analyze Button
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#3F3F5F',
    opacity: 0.7,
  },
  analyzeButtonIcon: {
    fontSize: 20,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Permission Screen
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Debug Button
  debugButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  debugButtonText: {
    color: '#6B7280',
    fontSize: 12,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    color: '#4B5563',
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalClose: {
    fontSize: 24,
    color: '#9CA3AF',
    padding: 4,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  settingInput: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  settingHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#4ADE80',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
  
  // Photo Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: '#2A2A3E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  pickerButtonIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerButtonEmoji: {
    fontSize: 28,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pickerButtonHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  pickerCancelButton: {
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
  },
  pickerCancelText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
});

