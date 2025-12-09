# Assets Klasörü

Bu klasör Expo uygulama ikonları ve splash ekran görsellerini içerir.

## Gerekli Dosyalar

1. **icon.png** - Uygulama ikonu (1024x1024 px)
2. **adaptive-icon.png** - Android adaptive ikon (1024x1024 px)
3. **splash.png** - Splash ekran görseli (1284x2778 px önerilir)
4. **favicon.png** - Web favicon (48x48 px)

## Placeholder Görseller Oluşturma

Geliştirme sırasında test için basit placeholder görseller oluşturabilirsiniz.

### Online Araçlar

- https://placeholderimage.dev/
- https://www.canva.com/

### Önerilen Boyutlar

| Dosya | Boyut | Açıklama |
|-------|-------|----------|
| icon.png | 1024x1024 | Ana uygulama ikonu |
| adaptive-icon.png | 1024x1024 | Android için |
| splash.png | 1284x2778 | Splash ekran |
| favicon.png | 48x48 | Web için |

## Renk Paleti

Uygulamanın tema renkleri:
- Ana arka plan: #0F0F1A
- Kart arka plan: #1E1E2E
- Vurgu renk: #6366F1 (indigo)
- Başarı renk: #4ADE80 (yeşil)
- Hata renk: #EF4444 (kırmızı)

## Expo Asset Oluşturma

```bash
# Expo'nun asset generator'ını kullanabilirsiniz
npx expo install expo-asset
```

