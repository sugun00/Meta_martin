/**
 * Math Lens - TypeScript Tip Tanımlamaları
 */

/**
 * Backend'den gelen analiz sonucu
 */
export type AnalyzeResult = {
  success: boolean;
  type?: "math" | "text" | "other";
  steps?: string[];
  final_answer?: string;
  raw_model_response?: string;
  error?: string;
};

/**
 * Galeriden alınan fotoğraf bilgisi
 */
export type PhotoInfo = {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  width: number;
  height: number;
  mediaType: string;
};

/**
 * AsyncStorage'da saklanan son işlenen fotoğraf bilgisi
 */
export type LastProcessedInfo = {
  photoId: string;
  processedAt: number;
  filename?: string;
};

/**
 * Uygulama durumu
 */
export type AppStatus = 
  | "idle"
  | "loading_permissions"
  | "permission_denied"
  | "scanning_photos"
  | "no_new_photo"
  | "photo_ready"
  | "analyzing"
  | "analysis_complete"
  | "error";

/**
 * Uygulama yapılandırması
 */
export type AppConfig = {
  backendUrl: string;
  targetAlbumName: string;
  autoAnalyze: boolean;
  enableSpeech: boolean;
};

/**
 * API hata tipi
 */
export type ApiError = {
  message: string;
  code?: string;
  statusCode?: number;
};

