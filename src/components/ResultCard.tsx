/**
 * Math Lens - Sonuç Kartı Bileşeni
 * Analiz sonucunu görsel olarak sunar
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as Speech from 'expo-speech';
import { AnalyzeResult, PhotoInfo } from '../types';

interface ResultCardProps {
  photo: PhotoInfo;
  result: AnalyzeResult;
  onSpeakResult?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function ResultCard({ photo, result, onSpeakResult }: ResultCardProps) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  
  // Sonucu sesli oku
  const handleSpeak = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    // Okunacak metni hazırla
    let textToSpeak = '';
    
    if (result.type === 'math') {
      textToSpeak = 'Matematik problemi analiz edildi. ';
    } else if (result.type === 'text') {
      textToSpeak = 'Metin analiz edildi. ';
    }
    
    if (result.final_answer) {
      textToSpeak += `Sonuç: ${result.final_answer}`;
    }
    
    if (!textToSpeak) {
      textToSpeak = 'Sonuç bulunamadı.';
    }
    
    setIsSpeaking(true);
    
    Speech.speak(textToSpeak, {
      language: 'tr-TR',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    
    onSpeakResult?.();
  };
  
  // Tip etiketini renklendir
  const getTypeStyle = () => {
    switch (result.type) {
      case 'math':
        return { backgroundColor: '#4CAF50', label: '📐 Matematik' };
      case 'text':
        return { backgroundColor: '#2196F3', label: '📝 Metin' };
      default:
        return { backgroundColor: '#9E9E9E', label: '🔍 Diğer' };
    }
  };
  
  const typeStyle = getTypeStyle();
  
  return (
    <View style={styles.container}>
      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>✨ Analiz Sonucu</Text>
        <View style={[styles.typeBadge, { backgroundColor: typeStyle.backgroundColor }]}>
          <Text style={styles.typeText}>{typeStyle.label}</Text>
        </View>
      </View>
      
      {/* Fotoğraf Önizleme */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      
      {/* Çözüm Adımları */}
      {result.steps && result.steps.length > 0 && (
        <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>📋 Çözüm Adımları</Text>
          <ScrollView 
            style={styles.stepsScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {result.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Final Sonuç */}
      {result.final_answer && (
        <View style={styles.answerContainer}>
          <Text style={styles.sectionTitle}>🎯 Sonuç</Text>
          <View style={styles.answerBox}>
            <Text style={styles.answerText}>{result.final_answer}</Text>
          </View>
        </View>
      )}
      
      {/* Hata Mesajı */}
      {result.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {result.error}</Text>
        </View>
      )}
      
      {/* Sesli Okuma Butonu */}
      <TouchableOpacity
        style={[styles.speakButton, isSpeaking && styles.speakButtonActive]}
        onPress={handleSpeak}
        activeOpacity={0.7}
      >
        <Text style={styles.speakButtonText}>
          {isSpeaking ? '🔇 Durdur' : '🔊 Sonucu Sesli Oku'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#2A2A3E',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  stepsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  stepsScroll: {
    maxHeight: 200,
    backgroundColor: '#252536',
    borderRadius: 12,
    padding: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  answerContainer: {
    marginBottom: 16,
  },
  answerBox: {
    backgroundColor: '#2D5016',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4ADE80',
  },
  answerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#5C1414',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  speakButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  speakButtonActive: {
    backgroundColor: '#EF4444',
  },
  speakButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultCard;

