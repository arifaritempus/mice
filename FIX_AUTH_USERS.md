# Supabase Auth Kullanıcı Sorunu Çözümü

## 🔴 Sorun
"Invalid login credentials" hatası alınıyor. Kullanıcılar `users` tablosunda var ama `auth.users` tablosunda yok veya şifreleri yanlış.

## ✅ Çözüm Adımları

### 1. Supabase Dashboard'da Kullanıcıları Kontrol Edin

1. **Supabase Dashboard**: https://supabase.com/dashboard
2. Projenizi seçin: `gzdfdnfkyedwnameflso`
3. Sol menüden **Authentication** > **Users**'a gidin
4. Kullanıcıları kontrol edin:
   - `arif.ari@tempustravel.co`
   - `anilay.acikavak@tempustravel.co`

### 2. Kullanıcılar Yoksa Oluşturun

Eğer kullanıcılar listede yoksa:

1. **Add user** butonuna tıklayın
2. Her kullanıcı için:
   - **Email**: `arif.ari@tempustravel.co` (veya `anilay.acikavak@tempustravel.co`)
   - **Password**: `1234`
   - **Auto Confirm User**: ✓ **MUTLAKA İŞARETLEYİN**
   - **Create user** butonuna tıklayın

### 3. Kullanıcılar Varsa Şifrelerini Sıfırlayın

Eğer kullanıcılar listede varsa ama giriş yapamıyorsanız:

1. Kullanıcıya tıklayın
2. **"Reset Password"** butonuna tıklayın
3. Yeni şifre: `1234`
4. **"Update User"** butonuna tıklayın
5. **"Email Confirmed"** alanının `true` olduğundan emin olun

### 4. Email Doğrulamasını Kontrol Edin

1. Kullanıcıya tıklayın
2. **"Email Confirmed"** alanını kontrol edin
3. Eğer `false` ise:
   - **"Confirm Email"** butonuna tıklayın
   - Veya **"Auto Confirm User"** seçeneğini işaretleyin

### 5. SQL ile Kontrol Edin

Supabase SQL Editor'da `CHECK_AUTH_USERS.sql` dosyasını çalıştırın:

```sql
-- Auth.users tablosundaki kullanıcıları kontrol et
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users
WHERE email IN (
    'arif.ari@tempustravel.co',
    'anilay.acikavak@tempustravel.co'
);
```

### 6. Kullanıcıları Yeniden Oluşturun (Gerekirse)

Eğer kullanıcılar hala çalışmıyorsa:

1. **Authentication** > **Users**'a gidin
2. Mevcut kullanıcıları **silin** (eğer varsa)
3. **Add user** ile yeniden oluşturun:
   - Email: `arif.ari@tempustravel.co`
   - Password: `1234`
   - Auto Confirm User: ✓
   - Create user

4. İkinci kullanıcı için tekrarlayın:
   - Email: `anilay.acikavak@tempustravel.co`
   - Password: `1234`
   - Auto Confirm User: ✓
   - Create user

### 7. Users Tablosunu Güncelleyin

Kullanıcıları Auth'da oluşturduktan sonra, `users` tablosunu güncellemek için `CREATE_OWNER_USER.sql` dosyasını çalıştırın.

## 🧪 Test

1. Browser'ı yenileyin (Ctrl+Shift+R)
2. Giriş yapmayı deneyin:
   - Email: `arif.ari@tempustravel.co`
   - Password: `1234`
3. Başarılı olmalı!

## 📝 Notlar

- **ÖNEMLİ**: `users` tablosundaki kullanıcılar ile `auth.users` tablosundaki kullanıcılar **farklıdır**
- Giriş yapmak için kullanıcıların **mutlaka** `auth.users` tablosunda olması gerekir
- Şifreler Supabase Auth'da hash'lenir, `users` tablosunda saklanmaz
- Email doğrulaması (`email_confirmed_at`) mutlaka `true` olmalı

