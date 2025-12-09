/**
 * Math Lens Backend Server
 * AI ile görüntü analizi yapan Node.js sunucusu
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const heicConvert = require('heic-convert');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI Client - sadece API key varsa oluştur
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here') {
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI API bağlantısı hazır');
} else {
  console.log('⚠️  OpenAI API key bulunamadı - Demo mod aktif');
}

// Middleware
app.use(cors());
app.use(express.json());

// Multer yapılandırması (dosya yükleme için)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı. JPEG, PNG veya HEIC kullanın.'));
    }
  }
});

// ==================== ENDPOINTS ====================

/**
 * GET /health
 * Sunucu sağlık kontrolü
 */
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'Math Lens Backend',
    version: '1.0.0',
    openai_configured: openai !== null
  });
});

/**
 * GET /
 * Ana sayfa
 */
app.get('/', (req, res) => {
  res.json({
    message: '🔮 Math Lens Backend Server',
    status: 'running',
    openai_configured: openai !== null,
    endpoints: {
      health: 'GET /health',
      analyze: 'POST /analyze-image'
    }
  });
});

/**
 * POST /analyze-image
 * Fotoğrafı analiz et ve sonuç döndür
 */
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  console.log('\n📸 Yeni analiz isteği alındı');
  
  try {
    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Fotoğraf yüklenmedi. "image" alanı gerekli.'
      });
    }

    console.log(`   📁 Dosya: ${req.file.originalname}`);
    console.log(`   📐 Boyut: ${(req.file.size / 1024).toFixed(2)} KB`);

    // OpenAI yoksa demo yanıt döndür
    if (!openai) {
      console.log('   🎭 Demo mod - örnek yanıt döndürülüyor');
      
      // Dosyayı temizle
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.json({
        success: true,
        type: 'math',
        steps: [
          '1. Görüntü başarıyla alındı ✅',
          '2. Demo mod aktif (OpenAI API key gerekli)',
          '3. Gerçek analiz için:',
          '   - backend/.env dosyası oluşturun',
          '   - OPENAI_API_KEY=sk-xxx ekleyin',
          '4. platform.openai.com/api-keys adresinden key alabilirsiniz'
        ],
        final_answer: '🎉 Backend çalışıyor! API key ekleyince gerçek analiz yapılacak.',
        raw_model_response: 'Demo mode active'
      });
    }

    // Görüntüyü oku ve gerekirse JPEG'e dönüştür
    let imageBuffer = fs.readFileSync(req.file.path);
    let mimeType = req.file.mimetype;
    
    // HEIC formatını JPEG'e dönüştür (OpenAI HEIC desteklemiyor)
    if (mimeType === 'image/heic' || req.file.originalname.toLowerCase().endsWith('.heic')) {
      console.log('   🔄 HEIC → JPEG dönüştürülüyor...');
      try {
        const outputBuffer = await heicConvert({
          buffer: imageBuffer,
          format: 'JPEG',
          quality: 0.9
        });
        imageBuffer = Buffer.from(outputBuffer);
        mimeType = 'image/jpeg';
        console.log('   ✅ Dönüştürme başarılı');
      } catch (convertError) {
        console.error('   ❌ HEIC dönüştürme hatası:', convertError.message);
        // Dönüştürme başarısız olursa hata döndür
        return res.status(400).json({
          success: false,
          error: 'HEIC formatı dönüştürülemedi. Lütfen JPEG veya PNG fotoğraf kullanın.'
        });
      }
    }
    
    const base64Image = imageBuffer.toString('base64');

    console.log('   🧠 OpenAI API çağrılıyor...');

    // OpenAI Vision API çağrısı
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Sen bir matematik ve metin analiz asistanısın. Görüntülerdeki matematik problemlerini çöz veya metinleri analiz et.

Yanıtını şu JSON formatında ver:
{
  "type": "math" | "text" | "other",
  "steps": ["Adım 1...", "Adım 2...", ...],
  "final_answer": "Sonuç"
}

Kurallar:
- Matematik problemi varsa adım adım çöz
- Her adımı Türkçe açıkla
- Final cevabı net ve kısa yaz
- Metin varsa özetle ve analiz et
- JSON formatına uy`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Bu görüntüyü analiz et. Matematik problemi varsa çöz, metin varsa özetle.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
    });

    // Yanıtı parse et
    const rawResponse = response.choices[0].message.content;
    console.log('   ✅ OpenAI yanıtı alındı');

    // JSON'u çıkarmaya çalış
    let parsedResult;
    try {
      // JSON bloğunu bul
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON bulunamadı');
      }
    } catch (parseError) {
      // Parse edilemezse ham yanıtı kullan
      parsedResult = {
        type: 'other',
        steps: [rawResponse],
        final_answer: 'Analiz tamamlandı'
      };
    }

    // Dosyayı temizle
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Sonucu döndür
    const result = {
      success: true,
      type: parsedResult.type || 'other',
      steps: parsedResult.steps || [],
      final_answer: parsedResult.final_answer || '',
      raw_model_response: rawResponse
    };

    console.log(`   🎯 Sonuç: ${result.final_answer}`);

    res.json(result);

  } catch (error) {
    console.error('❌ Analiz hatası:', error.message);

    // Dosya varsa temizle
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Analiz sırasında bir hata oluştu'
    });
  }
});

// ==================== ERROR HANDLING ====================

// Multer hata yakalama
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu çok büyük. Maksimum 10 MB.'
      });
    }
  }
  
  console.error('❌ Sunucu hatası:', error.message);
  res.status(500).json({
    success: false,
    error: error.message
  });
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════╗
║         🔮 Math Lens Backend Server            ║
╠════════════════════════════════════════════════╣
║  Port: ${PORT}                                    ║
║  URL:  http://localhost:${PORT}                   ║
║  LAN:  http://192.168.107.230:${PORT}             ║
╠════════════════════════════════════════════════╣
║  Endpoints:                                    ║
║  - GET  /health        Sağlık kontrolü         ║
║  - POST /analyze-image Görüntü analizi         ║
╚════════════════════════════════════════════════╝
  `);

  if (!openai) {
    console.log(`
╔════════════════════════════════════════════════╗
║  ⚠️  DEMO MOD AKTİF                            ║
╠════════════════════════════════════════════════╣
║  Gerçek AI analizi için:                       ║
║  1. backend/.env dosyası oluşturun             ║
║  2. OPENAI_API_KEY=sk-xxx ekleyin              ║
║  3. Sunucuyu yeniden başlatın                  ║
╚════════════════════════════════════════════════╝
    `);
  }
});
