# Supabase Storage RLS Policy Düzeltme Rehberi

## Sorun
"new row violates row-level security policy" hatası alıyorsunuz.

## Çözüm: Policy'yi Doğru Yapılandırma

### Adım 1: Mevcut Policy'leri Kontrol Edin
1. Supabase Dashboard > Storage > logos bucket > **Policies** sekmesine gidin
2. Eğer INSERT policy varsa, **silin** (yanlış yapılandırılmış olabilir)
3. Tüm policy'leri temizleyin

### Adım 2: INSERT Policy'yi Doğru Şekilde Ekleyin

1. **New Policy** butonuna tıklayın
2. **Policy name**: `Authenticated users can upload logos`
3. **Allowed operation**: `INSERT` seçin
4. **Target roles**: `authenticated` seçin
5. **USING expression**: (BOŞ BIRAKIN - hiçbir şey yazmayın)
6. **WITH CHECK expression**: `bucket_id = 'logos'` yazın
7. **Save** butonuna tıklayın

### Adım 3: SELECT Policy'lerini Ekleyin

#### Policy 2: Authenticated Read
1. **New Policy** butonuna tıklayın
2. **Policy name**: `Authenticated users can read logos`
3. **Allowed operation**: `SELECT` seçin
4. **Target roles**: `authenticated` seçin
5. **USING expression**: `bucket_id = 'logos'` yazın
6. **WITH CHECK expression**: (BOŞ BIRAKIN)
7. **Save** butonuna tıklayın

#### Policy 3: Public Read
1. **New Policy** butonuna tıklayın
2. **Policy name**: `Public can read logos`
3. **Allowed operation**: `SELECT` seçin
4. **Target roles**: `public` seçin
5. **USING expression**: `bucket_id = 'logos'` yazın
6. **WITH CHECK expression**: (BOŞ BIRAKIN)
7. **Save** butonuna tıklayın

### Adım 4: UPDATE ve DELETE Policy'lerini Ekleyin (Opsiyonel)

#### Policy 4: Update
1. **New Policy** butonuna tıklayın
2. **Policy name**: `Authenticated users can update logos`
3. **Allowed operation**: `UPDATE` seçin
4. **Target roles**: `authenticated` seçin
5. **USING expression**: `bucket_id = 'logos'` yazın
6. **WITH CHECK expression**: `bucket_id = 'logos'` yazın
7. **Save** butonuna tıklayın

#### Policy 5: Delete
1. **New Policy** butonuna tıklayın
2. **Policy name**: `Authenticated users can delete logos`
3. **Allowed operation**: `DELETE` seçin
4. **Target roles**: `authenticated` seçin
5. **USING expression**: `bucket_id = 'logos'` yazın
6. **WITH CHECK expression**: (BOŞ BIRAKIN)
7. **Save** butonuna tıklayın

## Önemli Notlar

### INSERT Policy için:
- **USING expression**: BOŞ OLMALI (hiçbir şey yazmayın)
- **WITH CHECK expression**: `bucket_id = 'logos'` OLMALI

### SELECT Policy için:
- **USING expression**: `bucket_id = 'logos'` OLMALI
- **WITH CHECK expression**: BOŞ OLABİLİR

### UPDATE Policy için:
- **USING expression**: `bucket_id = 'logos'` OLMALI
- **WITH CHECK expression**: `bucket_id = 'logos'` OLMALI

### DELETE Policy için:
- **USING expression**: `bucket_id = 'logos'` OLMALI
- **WITH CHECK expression**: BOŞ OLABİLİR

## Test

Policy'leri ekledikten sonra:
1. Sayfayı yenileyin (hard refresh: Cmd+Shift+R)
2. Logo yükleme işlemini tekrar deneyin
3. Eğer hala hata alıyorsanız, tarayıcı konsolundaki (F12) hata mesajını kontrol edin

## Sorun Giderme

### Hata: "new row violates row-level security policy"
- INSERT policy'nin WITH CHECK expression'ının `bucket_id = 'logos'` olduğundan emin olun
- USING expression'ın boş olduğundan emin olun
- Policy'nin Target roles'ünün `authenticated` olduğundan emin olun

### Hata: "permission denied"
- Bucket'ın public olduğundan emin olun
- SELECT policy'lerinin eklendiğinden emin olun

