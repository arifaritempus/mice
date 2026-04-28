# Supabase Kurulum Rehberi

## 🚀 Supabase Projesi Oluşturma

### 1. Supabase Hesabı Oluşturma
1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın
4. Yeni bir organizasyon oluşturun

### 2. Yeni Proje Oluşturma
1. "New Project" butonuna tıklayın
2. Proje adı: `eventiq-mice`
3. Database Password: Güçlü bir şifre belirleyin
4. Region: En yakın bölgeyi seçin (örn: West Europe)
5. "Create new project" butonuna tıklayın

### 3. Veritabanı Şemasını Yükleme
1. Supabase Dashboard'da projenize gidin
2. Sol menüden "SQL Editor" seçin
3. "New query" butonuna tıklayın
4. `supabase-schema.sql` dosyasının içeriğini kopyalayın
5. SQL editörüne yapıştırın ve "Run" butonuna tıklayın

### 4. Environment Variables Ayarlama
1. Supabase Dashboard'da "Settings" > "API" bölümüne gidin
2. "Project URL" ve "anon public" key'i kopyalayın
3. Proje klasöründe `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Uygulamayı Yeniden Başlatma
```
npm run dev
```

## 📊 Veritabanı Tabloları

### Ana Tablolar:
- **quotes** - Teklifler
- **quote_items** - Teklif kalemleri
- **projects** - Projeler
- **agencies** - Acenteler
- **hotels** - Oteller
- **categories** - Kategoriler (ana ve alt)
- **budget_items** - Bütçe kalemleri

### İlişkiler:
- `quotes.agency_id` → `agencies.id`
- `quotes.hotel_id` → `hotels.id`
- `quote_items.quote_id` → `quotes.id`
- `projects.quote_id` → `quotes.id`
- `categories.main_category_id` → `categories.id`

## 🔧 Özellikler

### ✅ Otomatik Yedekleme
- Tüm veriler Supabase'de saklanır
- Gerçek zamanlı senkronizasyon
- Otomatik yedekleme

### ✅ Güvenlik
- Row Level Security (RLS) aktif
- UUID tabanlı ID'ler
- Otomatik timestamp'ler

### ✅ Performans
- İndeksler optimize edilmiş
- Foreign key ilişkileri
- Cascade delete

## 🚨 Önemli Notlar

1. **Environment Variables**: `.env.local` dosyasını `.gitignore`'a eklediğinizden emin olun
2. **API Keys**: Anon key'i public olabilir, service role key'i asla paylaşmayın
3. **RLS Policies**: Şu anda tüm işlemlere izin veriliyor, production'da kısıtlayabilirsiniz
4. **Backup**: Supabase otomatik yedekleme yapar, manuel yedekleme de alabilirsiniz

## 🔄 localStorage'dan Supabase'e Geçiş

Sistem şu anda localStorage kullanıyor. Supabase'e geçiş için:

1. Environment variables'ları ayarlayın
2. Uygulamayı yeniden başlatın
3. Mevcut localStorage verilerini Supabase'e aktarın (opsiyonel)

## 📞 Destek

Sorun yaşarsanız:
1. Supabase Dashboard'da "Support" bölümünü kontrol edin
2. Console'da hata mesajlarını kontrol edin
3. Network sekmesinde API çağrılarını kontrol edin 