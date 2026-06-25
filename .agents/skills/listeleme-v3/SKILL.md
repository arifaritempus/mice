---
name: Listeleme V3 Modernizasyonu
description: Tablo listelerini ve grid yapılarını V3 standardına (daraltılmış padding, hover efekti ve double click routing) günceller.
---

# Listeleme V3 Modernizasyonu

Kullanıcı "Listeleme V3 modernizasyonu" veya benzeri bir istekte bulunduğunda, belirtilen sayfalardaki (veya uygulamanın genelindeki) veri tablolarını (`<table>`) aşağıdaki kurallara göre modernize etmelisin:

1. **Hücre Boşluklarının (Padding) Daraltılması:**
   - Tablo başlıklarındaki (`<th>`) ve tablo hücrelerindeki (`<td>`) tüm `px-4 py-3` veya benzeri geniş padding sınıflarını bularak, daha sıkı ve kompakt olan `px-2.5 py-2.5` ile değiştir.

2. **Satır (Row) Hover Tasarımı & Etkileşim:**
   - Tablo gövdesindeki (`<tbody>`) satırlarda (`<tr>`) eski tip soluk vurguları (örn. `hover:bg-white/5`) kaldır.
   - Yerine şu sınıfları ekle: `hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0`
   - Bu sınıflar sayesinde liste hem daha premium bir mavi tonda parlayacak, hem de aralarına modern, ince çizgiler (border) eklenecek.

3. **Çift Tıklama (Double Click) ile Detaya Gitme:**
   - Satırların (`<tr>`) üzerine tıklandığında o satırdaki öğenin detay sayfasına gidilebilmesi için `onDoubleClick` handler'ı ekle.
   - Örnek: `onDoubleClick={() => router.push('/ilgili-sayfa/' + item.id)}`
   - **NOT:** Eğer sayfanın ayrı bir detay sayfası yoksa ve modal ile düzenleme açılıyorsa (Örn. Agencies veya Hotels sayfaları), `onDoubleClick={() => handleEdit(item)}` veya `setEditingItem(item)` şeklinde düzenleme modalını açacak fonksiyonu çağır.
   - Bu işlemin çalışabilmesi için component içerisine `const router = useRouter();` (next/navigation paketinden) eklendiğinden emin ol (eğer router kullanılacaksa).

4. **Tarih Alanlarında Gün İsimleri Gösterimi:**
   - Tablolarda tarih sütunları (Örn. Giriş/Çıkış veya Başlangıç/Bitiş) varsa, `src/utils/formatters.ts` içindeki `getDayNameShort` fonksiyonunu projeye dahil et.
   - Tarihlerin sağına küçük ve soluk renkte o tarihin hangi güne denk geldiğini yazan bir alan ekle.
   - Örnek kullanım formatı: 
     ```tsx
     <div className="flex items-center">
       <span>{formatDate(item.date)}</span>
       <span className="text-slate-500 ml-1 text-[10px] uppercase font-medium tracking-wider">, {getDayNameShort(item.date)}</span>
     </div>
     ```

Bu yetenek sayesinde, yeni eklenen her sayfayı veya eski sayfaları saniyeler içinde "Premium V3" listeleme standardına yükseltebilirsin.

5. **"Tek Düzen" Filtre ve Durum Çubuğu (Unified Header & Stats Strip):**
   - Sayfa ana `div` wrapper'ının `className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white"` olmasını sağla.
   - Bu `div` içindeki İLK element `className="w-full min-w-0 flex-1 flex flex-col"` olmalıdır. **DİKKAT:** Bu esnek wrapper (`flex-1`) sayfanın *sonuna kadar* (Modal'lardan hemen öncesine kadar) her şeyi sarmalıdır. Arama çubuğundan sonra KAPANMAMALIDIR! Eğer erkenden kapanan bir `</div>` varsa silip sayfa sonuna taşı.
   - Filtrelerin altındaki durum barlarını "Unified Stats Strip" formatına getir: `className="flex flex-wrap items-center gap-2 mb-2 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0"`. İçi `Durum: ` etiketiyle başlamalı ve tam genişlikte yatay uzanmalıdır (`w-max` kullanma).
