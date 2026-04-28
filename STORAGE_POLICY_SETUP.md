# Supabase Storage RLS Politikaları Kurulum Rehberi

## Sorun
SQL scriptini çalıştırırken "must be owner of table objects" hatası alıyorsunuz.

## Çözüm: Supabase Dashboard'dan Manuel Kurulum

Supabase Storage için RLS politikaları genellikle Dashboard üzerinden ayarlanır. SQL ile doğrudan `storage.objects` tablosuna erişim kısıtlı olabilir.

### Adım 1: Supabase Dashboard'a Gidin
1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin

### Adım 2: Storage Bucket'ı Kontrol Edin
1. Sol menüden **Storage** sekmesine tıklayın
2. **logos** bucket'ının var olduğunu ve **Public** olduğunu kontrol edin
3. Eğer bucket yoksa, **New bucket** butonuna tıklayın:
   - Bucket name: `logos`
   - Public bucket: **Aktif** (ON)
   - Save butonuna tıklayın

### Adım 3: RLS Politikalarını Ekleyin
1. **logos** bucket'ına tıklayın
2. Üst menüden **Policies** sekmesine tıklayın
3. **New Policy** butonuna tıklayın

#### Policy 1: Upload (INSERT)
- **Policy name**: `Authenticated users can upload logos`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**: (boş bırakın)
- **WITH CHECK expression**: `bucket_id = 'logos'`
- **Save** butonuna tıklayın

#### Policy 2: Read - Authenticated (SELECT)
- **Policy name**: `Authenticated users can read logos`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**: `bucket_id = 'logos'`
- **Save** butonuna tıklayın

#### Policy 3: Read - Public (SELECT)
- **Policy name**: `Public can read logos`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'logos'`
- **Save** butonuna tıklayın

#### Policy 4: Update (UPDATE)
- **Policy name**: `Authenticated users can update logos`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**: `bucket_id = 'logos'`
- **WITH CHECK expression**: `bucket_id = 'logos'`
- **Save** butonuna tıklayın

#### Policy 5: Delete (DELETE)
- **Policy name**: `Authenticated users can delete logos`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**: `bucket_id = 'logos'`
- **Save** butonuna tıklayın

### Adım 4: Politikaları Kontrol Edin
1. **Policies** sekmesinde 5 policy'nin de listelendiğini kontrol edin
2. Her policy'nin yanında yeşil bir onay işareti olmalı

### Adım 5: Test Edin
1. Frontend uygulamanızda logo yükleme işlemini deneyin
2. Tarayıcı konsolunu açın (F12) ve hata mesajlarını kontrol edin
3. Eğer hala hata alıyorsanız, hata mesajını not edin

## Alternatif: Service Role Key ile SQL Çalıştırma

Eğer yukarıdaki yöntem işe yaramazsa, Service Role Key kullanarak SQL çalıştırabilirsiniz:

1. Supabase Dashboard > Settings > API
2. **service_role** key'i kopyalayın (dikkatli olun, bu key çok güçlü!)
3. SQL Editor'de scripti çalıştırın (service_role key ile)

**NOT**: Service Role Key'i asla frontend kodunda kullanmayın! Sadece backend'de kullanın.

## Sorun Giderme

### Hata: "new row violates row-level security policy"
- RLS politikalarının doğru ayarlandığından emin olun
- Bucket'ın public olduğunu kontrol edin
- Kullanıcının authenticated olduğundan emin olun

### Hata: "must be owner of table objects"
- SQL scriptini çalıştırmayın
- Dashboard'dan manuel olarak politikaları ekleyin (yukarıdaki adımları takip edin)

### Logo yükleniyor ama görünmüyor
- Bucket'ın public olduğundan emin olun
- Public can read logos policy'sinin eklendiğinden emin olun
- Logo URL'ini tarayıcıda açmayı deneyin

