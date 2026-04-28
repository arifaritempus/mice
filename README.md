# 🚀 EventIQ - Etkinlik Yönetim Sistemi

Modern ve kapsamlı etkinlik yönetim sistemi. Node.js backend ve Next.js frontend ile geliştirilmiştir.

## 🏗️ Proje Yapısı

```
EVENTIQ/
├── backend/          # Node.js + Express API
├── frontend/         # Next.js + React Frontend
├── start-dev.sh      # Tüm servisleri başlat
├── start-backend.sh  # Sadece backend
└── start-frontend.sh # Sadece frontend
```

## 🚀 Hızlı Başlangıç

### 1. Tüm Servisleri Başlat (Önerilen)
```bash
./start-dev.sh
```

### 2. Sadece Backend
```bash
./start-backend.sh
```

### 3. Sadece Frontend
```bash
./start-frontend.sh
```

## 📡 Port Yapılandırması

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

## 🛠️ Manuel Kurulum

### Backend Kurulumu
```bash
cd backend
npm install
npm run dev
```

### Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Geliştirme Komutları

### Backend
```bash
cd backend
npm run dev      # Geliştirme modu
npm start        # Prodüksiyon
npm test         # Testler
```

### Frontend
```bash
cd frontend
npm run dev      # Geliştirme modu
npm run build    # Build
npm start        # Prodüksiyon
npm run lint     # Linting
```

## 🌐 API Endpoints

Backend API'ye `http://localhost:3001/api/*` üzerinden erişebilirsiniz:

- `/api/auth` - Kimlik doğrulama
- `/api/projects` - Proje yönetimi
- `/api/events` - Etkinlik yönetimi
- `/api/users` - Kullanıcı yönetimi
- `/api/reports` - Raporlar
- Ve daha fazlası...

## 📱 Özellikler

- ✅ Kullanıcı yönetimi ve yetkilendirme
- ✅ Proje ve etkinlik yönetimi
- ✅ Bütçe takibi
- ✅ Müşteri ve tedarikçi yönetimi
- ✅ Raporlama sistemi
- ✅ Gerçek zamanlı bildirimler (Socket.io)
- ✅ Dosya yükleme
- ✅ E-posta entegrasyonu
- ✅ Responsive tasarım

## 🛡️ Güvenlik

- JWT tabanlı kimlik doğrulama
- Rate limiting
- CORS koruması
- Helmet güvenlik başlıkları
- Input validasyonu

## 📊 Veritabanı

Supabase PostgreSQL veritabanı kullanılmaktadır.

## 🔄 Güncelleme

```bash
# Backend güncelleme
cd backend && npm update

# Frontend güncelleme
cd frontend && npm update
```

## 📝 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

Herhangi bir sorun yaşarsanız issue açabilir veya ekibimizle iletişime geçebilirsiniz. 