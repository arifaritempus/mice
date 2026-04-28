# Logo Yükleme Sorunu Çözümü

## Sorun
Backend'de "signature verification failed" hatası alıyorsunuz. Bu, Service Role Key'in yanlış olduğunu gösteriyor.

## Çözüm: Service Role Key'i Doğrulama

### Adım 1: Supabase Dashboard'dan Service Role Key'i Alın

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin (https://gzdfdnfkyedwnameflso.supabase.co)
3. Sol menüden **Settings** > **API** sekmesine gidin
4. **service_role** key'i kopyalayın (⚠️ DİKKAT: Bu key çok güçlü, asla frontend'de kullanmayın!)

### Adım 2: Backend .env Dosyasını Güncelleyin

1. `/Users/arifari/Desktop/TT_Sistem/backend/.env` dosyasını açın
2. `SUPABASE_SERVICE_ROLE_KEY` değerini Supabase Dashboard'dan kopyaladığınız key ile değiştirin
3. Dosyayı kaydedin

### Adım 3: Backend'i Yeniden Başlatın

Backend otomatik olarak yeniden başlamalı (nodemon kullanıyorsanız). Eğer başlamazsa:

```bash
cd /Users/arifari/Desktop/TT_Sistem/backend
npm run dev
```

### Adım 4: Test Edin

1. Frontend'de sayfayı yenileyin (hard refresh: Cmd+Shift+R)
2. Logo yükleme işlemini tekrar deneyin
3. Backend terminal'inde logları kontrol edin

## Önemli Notlar

- Service Role Key'i asla frontend kodunda kullanmayın!
- Service Role Key sadece backend'de kullanılmalı
- Service Role Key RLS politikalarını bypass eder, bu yüzden dikkatli kullanın

## Alternatif: Service Role Key Olmadan

Eğer Service Role Key kullanmak istemiyorsanız, Supabase Dashboard'dan RLS politikalarını doğru şekilde ayarlamanız gerekiyor (STORAGE_POLICY_SETUP.md dosyasına bakın).

