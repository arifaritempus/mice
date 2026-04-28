# 🔐 Kimlik Doğrulama Sistemi Kurulum Rehberi

## 📋 Genel Bakış

Bu sistem şu özellikleri içerir:
- **E-posta/Şifre ile Giriş**
- **Rol Tabanlı Yetki Sistemi (RBAC)**
- **Kullanıcı Yönetimi**
- **Profil Güncelleme**
- **Şifre Değiştirme**

## 🏗️ Sistem Mimarisi

### Roller ve Yetkiler

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| **Süper Admin** | Tam sistem yöneticisi | Tüm modüller için tam yetki |
| **Admin** | Sistem yöneticisi | Kullanıcı yönetimi hariç tam yetki |
| **Müdür** | Proje müdürü | Görüntüleme, düzenleme, ekleme |
| **Kullanıcı** | Normal kullanıcı | Sınırlı yetkiler |
| **Görüntüleyici** | Sadece görüntüleme | Sadece görüntüleme |

### Modüller ve Yetkiler

Her modül için 4 temel yetki:
- **Görüntüleme** (VIEW)
- **Düzenleme** (EDIT) 
- **Ekleme** (CREATE)
- **Silme** (DELETE)

## 🚀 Kurulum Adımları

### 1. Supabase Projesi Kurulumu

1. **Supabase Dashboard**'a gidin
2. **Yeni Proje** oluşturun
3. **Database Password**'ü not edin
4. **Project URL** ve **Anon Key**'i kopyalayın

### 2. Veritabanı Şeması

1. **SQL Editor**'a gidin
2. `supabase-schema.sql` dosyasının içeriğini yapıştırın
3. **Run** butonuna tıklayın

### 3. Environment Variables

`.env.local` dosyasını oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Auth Ayarları

1. **Authentication > Settings**'e gidin
2. **Site URL**'i ayarlayın: `http://localhost:3000`
3. **Redirect URLs**'e ekleyin:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/login`

### 5. İlk Kullanıcı Oluşturma

Supabase Dashboard > **Authentication > Users**'da:

1. **Add User** butonuna tıklayın
2. E-posta: `admin@tempustravel.com`
3. Şifre: `admin123` (geçici)
4. **Auto-confirm** seçeneğini işaretleyin
5. **Create** butonuna tıklayın

### 6. Kullanıcı Rolü Atama

SQL Editor'da çalıştırın:

```sql
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'admin@tempustravel.com';
```

## 🔧 Kullanım

### Giriş Yapma

1. `http://localhost:3000` adresine gidin
2. Otomatik olarak `/login` sayfasına yönlendirileceksiniz
3. E-posta ve şifre ile giriş yapın
4. Başarılı girişte `/dashboard`'a yönlendirileceksiniz

### Kullanıcı Yönetimi

**Sadece Admin ve Süper Admin kullanıcıları:**

1. **Kullanıcılar** menüsüne gidin
2. **Yeni Kullanıcı Ekle** butonuna tıklayın
3. Kullanıcı bilgilerini doldurun
4. Rol seçin
5. **Oluştur** butonuna tıklayın

### Profil Yönetimi

Her kullanıcı kendi profilini güncelleyebilir:

1. Sidebar'da **Profil** linkine tıklayın
2. **Profil Bilgileri** bölümünde bilgileri güncelleyin
3. **Şifre Değiştir** bölümünde şifre değiştirin

## 🛡️ Güvenlik

### RLS (Row Level Security)

Tüm tablolar RLS ile korunmaktadır:

- **Kullanıcılar**: Sadece kendi profilini görür, adminler tümünü görür
- **Diğer Tablolar**: Giriş yapmış kullanıcılar görür

### Şifre Güvenliği

- Minimum 6 karakter
- Büyük/küçük harf karışımı önerilir
- Sayı ve özel karakter önerilir

## 🔄 Yetki Kontrolü

### Frontend'de Yetki Kontrolü

```typescript
import { permissionService, Module, Permission } from '@/lib/permissions';

// Kullanıcının yetkisi var mı kontrol et
const canEdit = permissionService.hasPermission(userRole, Module.QUOTES, Permission.EDIT);

// React Hook kullanımı
const { canView, canEdit, canCreate, canDelete } = usePermissions(userRole);
```

### Backend'de Yetki Kontrolü

```sql
-- RLS Policy örneği
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);
```

## 🚨 Sorun Giderme

### Yaygın Sorunlar

1. **"Invalid login credentials"**
   - E-posta ve şifreyi kontrol edin
   - Kullanıcının aktif olduğundan emin olun

2. **"Permission denied"**
   - Kullanıcı rolünü kontrol edin
   - Gerekli yetkilerin atandığından emin olun

3. **"Table does not exist"**
   - SQL şemasının çalıştırıldığından emin olun
   - Tablo adlarını kontrol edin

### Debug

1. **Browser Console**'u açın (F12)
2. **Network** sekmesinde API çağrılarını kontrol edin
3. **Supabase Dashboard > Logs**'da hataları kontrol edin

## 📝 Test Senaryoları

### 1. Giriş Testi
- ✅ Doğru e-posta/şifre ile giriş
- ✅ Yanlış e-posta/şifre ile hata
- ✅ Pasif kullanıcı ile giriş engeli

### 2. Yetki Testi
- ✅ Farklı rollerle sayfa erişimi
- ✅ Buton görünürlüğü kontrolü
- ✅ İşlem yetkileri kontrolü

### 3. Kullanıcı Yönetimi Testi
- ✅ Yeni kullanıcı oluşturma
- ✅ Kullanıcı düzenleme
- ✅ Kullanıcı silme
- ✅ Rol değiştirme

## 🔄 Güncelleme

### Yeni Rol Ekleme

1. `frontend/src/lib/permissions.ts`'de rol tanımlayın
2. Yetki matrisini güncelleyin
3. Türkçe çevirileri ekleyin

### Yeni Modül Ekleme

1. `Module` enum'una ekleyin
2. Rol yetkilerini tanımlayın
3. RLS policy'leri ekleyin

## 📞 Destek

Sorun yaşarsanız:
1. Console hatalarını kontrol edin
2. Supabase Dashboard > Logs'u kontrol edin
3. Environment variables'ları kontrol edin
4. SQL şemasının doğru çalıştığından emin olun

---

**Not**: Bu sistem production'a geçmeden önce ek güvenlik önlemleri alınmalıdır. 