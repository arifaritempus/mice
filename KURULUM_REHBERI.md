# EventIQ Kurulum Rehberi

Bu rehber, EventIQ kapsamlı etkinlik yönetim sistemini kurmanız için adım adım talimatları içerir.

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Supabase hesabı
- Git

### 2. Projeyi İndirin
```
git clone <repository-url>
cd EVENTIQ
```

### 3. Supabase Projesi Oluşturun
1. [Supabase](https://supabase.com) sitesine gidin
2. Yeni proje oluşturun
3. Proje URL'sini ve API anahtarlarını not edin

### 4. Backend Kurulumu
```bash
cd backend
npm install
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_random_secret_key
PORT=3001
NODE_ENV=development
```

### 5. Veritabanı Kurulumu
Supabase SQL Editor'da `backend/src/database/schema.sql` dosyasındaki tüm SQL komutlarını çalıştırın.

### 6. Frontend Kurulumu
```
cd ../frontend
npm install
cp env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 7. Sistemi Başlatın
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 8. Erişim
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

## 📋 Detaylı Kurulum

### Backend Konfigürasyonu

#### E-posta Servisi
Gmail kullanıyorsanız:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Dosya Yükleme
```env
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

#### Ödeme Sistemi (Stripe)
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Frontend Konfigürasyonu

#### Analitik
```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

#### Özellik Bayrakları
```env
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## 🔧 Geliştirme Ortamı

### Kod Kalitesi
```bash
# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint
npm run type-check
```

### Test Çalıştırma
```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
cd frontend
npm test
```

## 🚀 Production Deployment

### Backend (Vercel)
1. Vercel'de yeni proje oluşturun
2. GitHub repository'nizi bağlayın
3. Root directory: `backend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables'ları ekleyin

### Frontend (Vercel)
1. Vercel'de yeni proje oluşturun
2. GitHub repository'nizi bağlayın
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `.next`
6. Environment variables'ları ekleyin

### Veritabanı (Supabase)
1. Production Supabase projesi oluşturun
2. Schema'yı migrate edin
3. Row Level Security (RLS) politikalarını etkinleştirin
4. Backup stratejisi oluşturun

## 🔒 Güvenlik

### Environment Variables
- Tüm hassas bilgileri environment variables olarak saklayın
- `.env` dosyalarını git'e commit etmeyin
- Production'da güçlü JWT secret kullanın

### API Güvenliği
- Rate limiting etkinleştirin
- CORS ayarlarını yapılandırın
- Input validation kullanın
- SQL injection koruması

### Veritabanı Güvenliği
- RLS politikalarını etkinleştirin
- Güçlü şifreler kullanın
- Düzenli backup alın
- Access log'ları takip edin

## 📊 Monitoring

### Logging
```env
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Health Checks
- Backend: `GET /health`
- Frontend: Built-in Next.js health check
- Database: Supabase dashboard

### Performance
- API response time monitoring
- Database query optimization
- Frontend bundle size analysis
- CDN kullanımı

## 🔧 Troubleshooting

### Yaygın Sorunlar

#### Backend Başlatılamıyor
```bash
# Port kontrolü
lsof -i :3001

# Log kontrolü
tail -f backend/logs/app.log

# Environment variables kontrolü
node -e "console.log(require('dotenv').config())"
```

#### Frontend Build Hatası
```
# Node modules temizleme
rm -rf node_modules package-lock.json
npm install

# TypeScript hataları
npm run type-check
```

#### Veritabanı Bağlantı Hatası
1. Supabase URL ve key'leri kontrol edin
2. Network bağlantısını test edin
3. Supabase dashboard'da proje durumunu kontrol edin

#### E-posta Gönderimi Çalışmıyor
1. SMTP ayarlarını kontrol edin
2. Gmail App Password kullanın
3. Firewall ayarlarını kontrol edin

## 📞 Destek

Sorun yaşarsanız:
1. GitHub Issues'da arama yapın
2. Yeni issue oluşturun
3. Detaylı hata mesajları ekleyin
4. Environment bilgilerini paylaşın

## 🎯 Sonraki Adımlar

Kurulum tamamlandıktan sonra:
1. İlk kullanıcı hesabını oluşturun
2. Test etkinliği oluşturun
3. Özellikleri keşfedin
4. Customization yapın
5. Production'a deploy edin

---

**EventIQ** - Başarılı etkinlikler için! 🚀 