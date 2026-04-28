# Supabase Entegrasyon Standardı

## 🎯 **Amaç**
Tüm sayfalarda tutarlı Supabase entegrasyonu sağlamak ve veri kaybını önlemek.

## 📋 **Zorunlu Adımlar**

### **1. Import Gereksinimleri**
```typescript
import { [EntityName]Service } from '@/lib/supabaseService';
```

### **2. Interface Tanımları**
```typescript
interface [EntityName] {
  id: string;
  // ... diğer alanlar
  created_at: string;
  updated_at?: string;
}
```

### **3. Veri Yükleme Fonksiyonu**
```typescript
const load[EntityName]s = async () => {
  try {
    // Supabase'den yükle
    const supabaseData = await [entityName]Service.getAll();
    
    // Supabase boşsa localStorage'dan migrate et
    if (supabaseData.length === 0) {
      await migrateFromLocalStorage();
      const migratedData = await [entityName]Service.getAll();
      set[EntityName]s(migratedData);
      localStorage.setItem('[entityName]s', JSON.stringify(migratedData));
      return;
    }
    
    set[EntityName]s(supabaseData);
    localStorage.setItem('[entityName]s', JSON.stringify(supabaseData));
  } catch (error) {
    console.error('Error loading [entityName]s from Supabase:', error);
    
    // Fallback to localStorage
    const savedData = localStorage.getItem('[entityName]s');
    if (savedData) {
      set[EntityName]s(JSON.parse(savedData));
    }
  } finally {
    setLoading(false);
  }
};
```

### **4. Migration Fonksiyonu**
```typescript
const migrateFromLocalStorage = async () => {
  try {
    console.log('Migrating [entityName]s from localStorage to Supabase...');
    
    const savedData = localStorage.getItem('[entityName]s');
    if (!savedData) {
      console.log('No [entityName]s found in localStorage');
      return;
    }

    const data = JSON.parse(savedData);
    console.log(`Found ${data.length} [entityName]s to migrate`);

    for (const item of data) {
      try {
        await [entityName]Service.create({
          // ... item fields
        });
        console.log(`Migrated [entityName]: ${item.name}`);
      } catch (error) {
        console.error(`Error migrating [entityName] ${item.name}:`, error);
      }
    }

    console.log('[EntityName]s migration completed successfully!');
  } catch (error) {
    console.error('Error during [entityName]s migration:', error);
  }
};
```

### **5. CRUD İşlemleri**

#### **Create**
```typescript
const handleCreate = async (data: CreateData) => {
  try {
    const newItem = await [entityName]Service.create(data);
    set[EntityName]s(prev => [...prev, newItem]);
    localStorage.setItem('[entityName]s', JSON.stringify([...items, newItem]));
    alert('[EntityName] başarıyla oluşturuldu!');
  } catch (error) {
    console.error('Error creating [entityName]:', error);
    alert('[EntityName] oluşturulurken bir hata oluştu.');
  }
};
```

#### **Update**
```typescript
const handleUpdate = async (id: string, data: UpdateData) => {
  try {
    await [entityName]Service.update(id, data);
    set[EntityName]s(prev => prev.map(item => 
      item.id === id ? { ...item, ...data } : item
    ));
    alert('[EntityName] başarıyla güncellendi!');
  } catch (error) {
    console.error('Error updating [entityName]:', error);
    alert('[EntityName] güncellenirken bir hata oluştu.');
  }
};
```

#### **Delete**
```typescript
const handleDelete = async (id: string) => {
  if (confirm('Bu [entityName]i silmek istediğinizden emin misiniz?')) {
    try {
      await [entityName]Service.delete(id);
      set[EntityName]s(prev => prev.filter(item => item.id !== id));
      alert('[EntityName] başarıyla silindi!');
    } catch (error) {
      console.error('Error deleting [entityName]:', error);
      alert('[EntityName] silinirken bir hata oluştu.');
    }
  }
};
```

## 🔧 **Supabase Şema Güncellemeleri**

### **Yeni Tablo Eklendiğinde:**
1. `supabase-schema.sql` dosyasını güncelle
2. `frontend/src/lib/supabase.ts` dosyasında interface tanımla
3. `frontend/src/lib/supabaseService.ts` dosyasında servis fonksiyonları ekle

### **Mevcut Tablo Güncellendiğinde:**
1. Supabase SQL Editor'da ALTER TABLE komutları çalıştır
2. Interface'leri güncelle
3. Migration fonksiyonlarını test et

## 📝 **Test Kontrol Listesi**

- [ ] Sayfa yüklendiğinde Supabase'den veri geliyor
- [ ] localStorage'dan migration çalışıyor
- [ ] Yeni kayıt oluşturma Supabase'e kaydediliyor
- [ ] Güncelleme işlemi Supabase'de çalışıyor
- [ ] Silme işlemi Supabase'den siliyor
- [ ] Hata durumunda fallback çalışıyor
- [ ] Console'da migration mesajları görünüyor

## ⚠️ **Önemli Notlar**

1. **Her zaman try-catch kullan**
2. **localStorage fallback'i koru**
3. **Migration fonksiyonlarını ekle**
4. **Console logları ekle**
5. **Kullanıcıya hata mesajları göster**
6. **Interface'leri güncel tut**

## 🚀 **Yeni Sayfa Oluştururken**

1. Bu standardı takip et
2. Supabase servislerini import et
3. Migration fonksiyonu ekle
4. CRUD işlemlerini Supabase ile yap
5. localStorage fallback'i koru
6. Test et ve doğrula

## 📊 **Mevcut Durum**

### ✅ **Tamamlanan Sayfalar:**
- [x] Quotes (Teklifler)
- [x] Agencies (Acenteler)
- [x] Hotels (Oteller)
- [x] Projects (Projeler)
- [x] Budget (Bütçe)

### 🔄 **Kontrol Edilecek Sayfalar:**
- [ ] Settings (Ayarlar)
- [ ] Reports (Raporlar)
- [ ] Dashboard (Ana Sayfa)

### 📋 **Yapılacaklar:**
- [ ] Kalan sayfaları kontrol et
- [ ] Eksik Supabase entegrasyonlarını tamamla
- [ ] Tüm migration'ları test et
- [ ] Hata durumlarını kontrol et 