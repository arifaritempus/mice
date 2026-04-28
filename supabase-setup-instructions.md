# SUPABASE KURULUM TALİMATLARI

## 🚀 ADIM 1: SUPABASE DASHBOARD'A GİDİN
1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin: `gzdfdnfkyedwnameflso`

## 🗄️ ADIM 2: DATABASE SCHEMA KURUN
1. Sol menüden **SQL Editor**'ı seçin
2. **New Query** butonuna tıklayın
3. `supabase-migration-safe.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'a yapıştırın
5. **Run** butonuna tıklayın

## 🔑 ADIM 3: API KEYS'LERİ ALIN
1. Sol menüden **Settings** > **API** seçin
2. **Project URL**: `https://gzdfdnfkyedwnameflso.supabase.co` ✅
3. **anon public** key'i kopyalayın
4. **service_role** key'i kopyalayın

## ⚙️ ADIM 4: ENVIRONMENT VARIABLES GÜNCELLEYİN
`.env.local` dosyasını düzenleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gzdfdnfkyedwnameflso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=buraya_anon_key_yapıştırın
SUPABASE_SERVICE_ROLE_KEY=buraya_service_role_key_yapıştırın
```

## 🧪 ADIM 5: TEST EDİN
1. Development server çalışıyor: http://localhost:3000
2. Sayfaları test edin:
   - `/sejour` - Sejour listesi
   - `/projects` - Projeler listesi  
   - `/quotes` - Teklifler listesi

## 📊 BEKLENEN SONUÇ
- ✅ Supabase bağlantısı çalışacak
- ✅ localStorage verileri otomatik migrate olacak
- ✅ Tüm CRUD operasyonları Supabase'de çalışacak
- ✅ Real-time güncellemeler aktif olacak

## 🆘 SORUN GİDERME
Eğer hata alırsanız:
1. Supabase Dashboard > Logs kontrol edin
2. Browser Console'da hataları inceleyin
3. Network tab'da API isteklerini kontrol edin

---

**Not**: Schema kurulumu sırasında "relation already exists" hatası alırsanız, bu normaldir. Script sadece eksik tabloları oluşturur.
