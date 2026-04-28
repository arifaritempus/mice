# Etkinlik & Aktivite Modülü Kurulum Rehberi

## 📋 Özet

Etkinlik & Aktivite tabı başarıyla oluşturuldu. Bu modül, proje etkinliklerini ve aktivitelerini yönetmek için tasarlandı.

## 🎯 Özellikler

### ✅ Tamamlanan Özellikler

1. **Supabase Veritabanı Tablosu**
   - `project_events_activities` tablosu oluşturuldu
   - Tüm gerekli alanlar tanımlandı
   - RLS (Row Level Security) politikaları eklendi
   - İndeksler ve trigger'lar yapılandırıldı

2. **Backend API**
   - CRUD operasyonları için endpoint'ler oluşturuldu
   - Validasyon kuralları eklendi
   - İstatistik endpoint'i eklendi

3. **Frontend UI**
   - Tam işlevsel tablo görünümü
   - Inline düzenleme (Enter ile kaydet, Esc ile iptal)
   - Arama ve filtreleme
   - Sıralama özellikleri
   - Otel/Tedarikçi arama ve seçimi
   - Alt kategori seçimi
   - Otomatik TL hesaplaması (Tutar x Kur)
   - Özet istatistikler

## 📝 Gerekli Alanlar

### Tabloda Yer Alan Alanlar:

1. **Tarih** - Etkinlik tarihi (date picker)
2. **Otel/Tedarikçi** - Oteller ve Tedarikçiler sayfasından otomatik veri çeken açılır liste (aranabilir, klavye ile seçilebilir)
3. **Ana Kategori** - "Etkinlik & Aktivite" (varsayılan, görünmez)
4. **Alt Kategori** - CAT_005 ID'li kategoriye ait alt kategoriler (dropdown)
5. **Açıklama** - Serbest metin alanı
6. **Tutar** - Sayısal değer
7. **Döviz** - EUR, USD, GBP, TRY seçenekleri
8. **Kur** - Döviz kuru (4 ondalık basamak)
9. **Toplam TL** - Formüllü alan (Tutar x Kur) - Otomatik hesaplanır
10. **İşlemler** - Düzenle ve Sil butonları

### ⌨️ Klavye Kısayolları:

- **Enter**: Düzenlenen satırı kaydet
- **Esc**: Düzenlemeden çık (kaydetmeden)
- **Tab**: Alanlarda gezin

## 🚀 Kurulum Adımları

### 1. Supabase Veritabanı Tablosunu Oluştur

`events-activities-schema.sql` dosyasını Supabase SQL Editor'de çalıştırın:

```bash
# Dosya yolu:
/Users/arifari/Desktop/TT_Sistem/events-activities-schema.sql
```

**Supabase'de yapılacaklar:**
1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ü açın
3. `events-activities-schema.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. "Run" butonuna tıklayın

### 2. Backend Sunucusunu Yeniden Başlat

Backend sunucusunu yeniden başlatarak yeni route'ların yüklenmesini sağlayın:

```bash
cd /Users/arifari/Desktop/TT_Sistem
./start-backend.sh
```

veya manuel olarak:

```bash
cd /Users/arifari/Desktop/TT_Sistem/backend
npm start
```

### 3. Frontend'i Yeniden Başlat

Frontend'i yeniden başlatın:

```bash
cd /Users/arifari/Desktop/TT_Sistem
./start-frontend.sh
```

veya manuel olarak:

```bash
cd /Users/arifari/Desktop/TT_Sistem/frontend
npm run dev
```

## 📂 Oluşturulan/Güncellenen Dosyalar

### Yeni Dosyalar:
1. `/events-activities-schema.sql` - Supabase tablo şeması
2. `/backend/src/routes/project-events-activities.js` - Backend API routes
3. `/ETKINLIK_AKTIVITE_KURULUM.md` - Bu dosya

### Güncellenen Dosyalar:
1. `/backend/src/index.js` - Yeni route eklendi
2. `/frontend/src/lib/supabaseService.ts` - Yeni servis eklendi
3. `/frontend/src/app/projects/[id]/page.tsx` - Etkinlik & Aktivite tabı implementasyonu

## 🔍 Test Etme

### 1. Temel Fonksiyonları Test Et:

1. Bir projeye girin
2. "Etkinlik & Aktivite" tabına tıklayın
3. "Yeni Ekle" butonuna tıklayın
4. Formu doldurun:
   - Tarih seçin
   - Otel/Tedarikçi seçin (arama yaparak)
   - Alt kategori seçin
   - Açıklama girin
   - Tutar girin
   - Döviz seçin
   - Kur girin
5. Enter tuşuna basın veya Kaydet butonuna tıklayın
6. Kayıt oluşturulduğunu doğrulayın

### 2. Düzenleme ve Silme:

1. Bir kaydın üzerine tıklayın
2. Düzenle butonuna tıklayın
3. Değişiklik yapın
4. Enter ile kaydedin veya Esc ile iptal edin
5. Sil butonunu test edin

### 3. Formül Kontrolü:

1. Tutar girin (örn: 100)
2. Kur girin (örn: 35.50)
3. Toplam TL'nin otomatik hesaplandığını doğrulayın (3550.00)

### 4. Arama ve Filtreleme:

1. Birkaç kayıt oluşturun
2. Arama kutusuna bir açıklama yazın
3. Filtrelemenin çalıştığını doğrulayın

## 📊 API Endpoints

### Backend API:

- **GET** `/api/project-events-activities/project/:projectId` - Proje etkinliklerini getir
- **POST** `/api/project-events-activities` - Yeni etkinlik oluştur
- **PUT** `/api/project-events-activities/:id` - Etkinlik güncelle
- **DELETE** `/api/project-events-activities/:id` - Etkinlik sil
- **GET** `/api/project-events-activities/:id` - Etkinlik detayı
- **GET** `/api/project-events-activities/project/:projectId/stats` - İstatistikler

## 🔐 Güvenlik

- RLS (Row Level Security) politikaları aktif
- Kullanıcılar sadece kendi projelerindeki etkinlikleri görebilir/düzenleyebilir
- Permission sistem entegrasyonu (canView, canCreate, canEdit, canDelete)

## 🐛 Sorun Giderme

### Etkinlikler yüklenmiyor:

1. Backend sunucusunun çalıştığını kontrol edin
2. Supabase bağlantısını kontrol edin
3. Console'da hata mesajlarını kontrol edin

### Alt kategoriler görünmüyor:

1. Kategoriler tablosunda CAT_005 kodlu ana kategori olduğunu doğrulayın
2. Bu ana kategoriye bağlı alt kategoriler olduğunu doğrulayın

### Toplam TL hesaplanmıyor:

1. Tutar ve Kur alanlarının sayısal değer içerdiğini kontrol edin
2. Supabase'deki GENERATED ALWAYS AS sütununun doğru çalıştığını kontrol edin

## 📞 Destek

Herhangi bir sorun yaşarsanız, console loglarını kontrol edin ve hata mesajlarını paylaşın.

## ✅ Tamamlanan Özellikler Listesi

- [x] Supabase tablo şeması
- [x] Backend API endpoints
- [x] Frontend UI implementasyonu
- [x] CRUD operasyonları
- [x] Inline düzenleme
- [x] Klavye kısayolları (Enter/Esc)
- [x] Arama ve filtreleme
- [x] Sıralama
- [x] Otel/Tedarikçi seçimi (aranabilir)
- [x] Alt kategori seçimi
- [x] Otomatik TL hesaplaması
- [x] Özet istatistikler
- [x] Permission kontrolü
- [x] Dark mode desteği

## 🎉 Başarılı!

Etkinlik & Aktivite modülü kullanıma hazır!

