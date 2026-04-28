# TEMPUS TRAVEL - SUPABASE MIGRATION REHBERİ

Bu rehber, mevcut localStorage tabanlı sistemi Supabase'e geçirmek için gerekli adımları açıklar.

## 📋 MİGRASYON ÖNCESİ HAZIRLIK

### 1. Supabase Projesi Oluşturma
1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. "New Project" butonuna tıklayın
3. Proje adı: `tempus-travel-mice`
4. Database password oluşturun ve kaydedin
5. Region: `Europe West (London)` seçin

### 2. Environment Variables
`.env.local` dosyasına ekleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Gerekli Paketler
```bash
npm install @supabase/supabase-js
```

## 🗄️ VERİTABANI KURULUMU

### 1. Schema Oluşturma
`supabase-schema-complete.sql` dosyasını Supabase SQL Editor'da çalıştırın.

### 2. RLS (Row Level Security) Ayarları
Schema dosyasında RLS politikaları tanımlanmıştır. Bunları kontrol edin ve gerekirse özelleştirin.

### 3. Başlangıç Verileri
Schema dosyasında varsayılan veriler tanımlanmıştır:
- Kullanıcılar
- Kategoriler
- Hizmet tipleri
- Ayarlar
- Yetkiler

## 🔄 VERİ MİGRASYONU

### 1. Migration Script Çalıştırma
```javascript
// migration-to-supabase.js dosyasını çalıştırın
import DataMigration from './migration-to-supabase.js';

const migration = new DataMigration();
await migration.runMigration();
```

### 2. Veri Kontrolü
Migration sonrası verilerin doğru aktarıldığını kontrol edin:
- Kullanıcılar
- Projeler
- Teklifler
- Sejour'lar
- Operasyonlar

## 🔧 KOD DEĞİŞİKLİKLERİ

### 1. Import Değişiklikleri
```typescript
// Eski
import { readTable, writeTable } from '@/lib/supabase';

// Yeni
import { SupabaseService, SejourService, ProjectService } from '@/lib/supabaseService';
```

### 2. Veri Okuma
```typescript
// Eski localStorage kullanımı
const sejours = JSON.parse(localStorage.getItem('sejourData') || '[]');

// Yeni Supabase kullanımı
const sejours = await SejourService.getSejours();
```

### 3. Veri Yazma
```typescript
// Eski localStorage kullanımı
localStorage.setItem('sejourData', JSON.stringify(updatedSejours));

// Yeni Supabase kullanımı
await SejourService.createSejour(sejourData);
```

### 4. CRUD Operasyonları
```typescript
// CREATE
const newSejour = await SejourService.createSejour(sejourData);

// READ
const sejour = await SejourService.getSejourWithDetails(sejourId);
const sejours = await SejourService.getSejours();

// UPDATE
await SupabaseService.update('sejours', sejourId, updateData);

// DELETE
await SupabaseService.delete('sejours', sejourId);
```

## 📁 DOSYA DEĞİŞİKLİKLERİ

### 1. Güncellenecek Dosyalar
- `frontend/src/lib/supabase.ts` → `frontend/src/lib/supabaseService.ts`
- Tüm sayfa bileşenleri (localStorage kullanımlarını kaldır)
- `frontend/src/lib/permissions.ts` (Supabase entegrasyonu)

### 2. Kaldırılacak Dosyalar
- `frontend/src/utils/safeStorage.ts` (artık gerekli değil)

### 3. Yeni Dosyalar
- `migration-to-supabase.js`
- `supabase-schema-complete.sql`

## 🔐 AUTHENTICATION

### 1. Supabase Auth Kullanımı
```typescript
import { auth } from '@/lib/supabaseService';

// Giriş
await auth.signIn(email, password);

// Çıkış
await auth.signOut();

// Mevcut kullanıcı
const user = await auth.getCurrentUser();
```

### 2. Kullanıcı Rolleri
- `super_admin`: Tüm yetkiler
- `admin`: Delete hariç tüm yetkiler
- `manager`: View ve Create yetkileri
- `user`: Sadece View yetkisi
- `viewer`: Sadece View yetkisi

## 🚀 DEPLOYMENT

### 1. Environment Variables
Production'da environment variables'ları ayarlayın:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Database Backup
Migration öncesi mevcut veritabanını yedekleyin.

### 3. Rollback Planı
Eğer sorun olursa localStorage'a geri dönüş için:
- Eski kod versiyonunu saklayın
- Migration script'ini geri çalıştırın

## 📊 PERFORMANS OPTİMİZASYONU

### 1. Index'ler
Schema'da gerekli index'ler tanımlanmıştır:
- Foreign key'ler
- Sık kullanılan filtreler
- Tarih alanları

### 2. Query Optimizasyonu
```typescript
// İlişkili verileri tek seferde çek
const sejour = await SejourService.getSejourWithDetails(sejourId);
// Bu tek query ile sejour + rooms + flights + transfers + services çeker
```

### 3. Caching
Supabase'in built-in caching'ini kullanın veya React Query ekleyin.

## 🔍 MONİTORİNG

### 1. Supabase Dashboard
- Database performance
- API usage
- Error logs

### 2. Application Monitoring
- Console errors
- Network requests
- User feedback

## 📝 TESTING

### 1. Unit Tests
```typescript
// Supabase servisleri için test yazın
describe('SejourService', () => {
  it('should create sejour', async () => {
    const sejourData = { /* test data */ };
    const result = await SejourService.createSejour(sejourData);
    expect(result).toBeDefined();
  });
});
```

### 2. Integration Tests
- API endpoints
- Database operations
- Authentication flow

## 🚨 SORUN GİDERME

### 1. Yaygın Hatalar
- **RLS Policy Error**: Kullanıcı yetkilerini kontrol edin
- **Foreign Key Error**: İlişkili verilerin varlığını kontrol edin
- **Permission Denied**: Supabase yetkilerini kontrol edin

### 2. Debug Araçları
- Supabase Dashboard Logs
- Browser Network Tab
- Console Logs

## 📈 SONRAKI ADIMLAR

### 1. Real-time Features
```typescript
// Supabase real-time subscriptions
const subscription = supabase
  .channel('sejours')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'sejours' },
    (payload) => console.log('New sejour:', payload.new)
  )
  .subscribe();
```

### 2. File Storage
```typescript
// Supabase Storage kullanımı
const { data, error } = await supabase.storage
  .from('vouchers')
  .upload('voucher.pdf', file);
```

### 3. Advanced Features
- Full-text search
- Complex queries
- Data analytics
- API rate limiting

## 📞 DESTEK

Migration sırasında sorun yaşarsanız:
1. Supabase Documentation: https://supabase.com/docs
2. GitHub Issues: Proje repository'sinde issue açın
3. Community: Supabase Discord/Forum

---

**Not**: Bu migration büyük bir değişiklik olduğu için dikkatli bir şekilde test edilmelidir. Önce staging environment'ta deneyin.
