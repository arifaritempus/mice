const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Tüm uçak biletlerini getir (proje bazında)
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { search, sortField, sortDirection } = req.query;

    console.log('🔍 Uçak biletleri getirme isteği:', { projectId, search, sortField, sortDirection });
    console.log('🔍 Supabase client:', supabase ? 'Mevcut' : 'Yok');
    console.log('🔍 Supabase URL:', process.env.SUPABASE_URL);

    // Service role client kullan (RLS bypass)
    const client = supabaseAdmin || supabase;
    let query = client
      .from('project_flight_tickets')
      .select('*')
      .eq('project_id', projectId);

    // Arama filtresi
    if (search) {
      query = query.or(`tedarikci.ilike.%${search}%,havayolu.ilike.%${search}%,guzergah.ilike.%${search}%,pnr.ilike.%${search}%,misafirler.ilike.%${search}%`);
    }

    // Sıralama
    if (sortField) {
      const direction = sortDirection === 'desc' ? false : true;
      query = query.order(sortField, { ascending: direction });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    console.log('🔍 Query çalıştırılıyor...');
    const { data, error } = await query;
    console.log('🔍 Query sonucu:', { data, error });

    if (error) {
      console.error('❌ Uçak biletleri getirme hatası:', error);
      console.error('❌ Hata kodu:', error.code);
      console.error('❌ Hata mesajı:', error.message);
      console.error('❌ Hata detayları:', error.details);
      console.error('❌ Tam hata objesi:', JSON.stringify(error, null, 2));
      return res.status(500).json({
        error: 'Uçak biletleri getirilemedi',
        details: error.message,
        code: error.code
      });
    }

    console.log('✅ Uçak biletleri başarıyla getirildi:', data);
    console.log('✅ İlk veri detayları:', data[0]);
    console.log('✅ Veri tipleri:', data.map(item => ({
      biletleme_tarihi: typeof item.biletleme_tarihi,
      kisi_sayisi: typeof item.kisi_sayisi,
      pp_maliyet: typeof item.pp_maliyet,
      toplam_maliyet: typeof item.toplam_maliyet
    })));

    res.json(data || []);
  } catch (error) {
    console.error('Uçak biletleri getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Tek uçak bileti getir
router.get('/:projectId/:id', async (req, res) => {
  try {
    const { projectId, id } = req.params;

    // Service role client kullan (RLS bypass)
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('project_flight_tickets')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();

    if (error) {
      console.error('Uçak bileti getirme hatası:', error);
      return res.status(500).json({ error: 'Uçak bileti getirilemedi' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Uçak bileti bulunamadı' });
    }

    res.json(data);
  } catch (error) {
    console.error('Uçak bileti getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Yeni uçak bileti oluştur
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('Uçak bileti oluşturma isteği:', { projectId, body: req.body });

    // Sadece mevcut alanları kullan
    const allowedFields = [
      'biletleme_tarihi', 'tedarikci', 'havayolu', 'pnr', 'ucus_tipi',
      'gidis_tarihi', 'gidis_saati', 'gidis_ucus_kodu',
      'donus_tarihi', 'donus_saati', 'donus_ucus_kodu',
      'guzergah', 'kisi_sayisi', 'pp_maliyet', 'toplam_maliyet',
      'doviz', 'misafirler', 'durum', 'islemler',
      'satis_pax', 'pp_satis', 'toplam_satis', 'doviz_satis', 
      'satis_kur', 'toplam_satis_tl', 'satis_doviz', 'hotel_id'
    ];

    // Yeni alanları kontrol et ve ekle (eğer mevcut ise)
    const flightTicketData = {
      project_id: projectId
    };

    // Mevcut alanları ekle
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        // Boş string kontrolü - sadece ucus_tipi için boş string'e izin ver
        if (field === 'ucus_tipi' || req.body[field] !== '') {
          flightTicketData[field] = req.body[field];
        }
      }
    });

    // Yeni alanları ekle (eğer tabloda varsa)
    if (req.body.kur !== undefined && req.body.kur !== null) {
      flightTicketData.kur = req.body.kur;
    }
    if (req.body.toplam_tl !== undefined && req.body.toplam_tl !== null) {
      flightTicketData.toplam_tl = req.body.toplam_tl;
    }

    console.log('🔵 Backend: req.body.ucus_tipi:', req.body.ucus_tipi);
    console.log('🔵 Backend: flightTicketData.ucus_tipi:', flightTicketData.ucus_tipi);
    console.log('🔵 Backend: Hazırlanan veri:', JSON.stringify(flightTicketData, null, 2));

    // Service role client kullan (RLS bypass)
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('project_flight_tickets')
      .insert([flightTicketData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase hatası:', error);
      console.error('❌ Hata detayları:', JSON.stringify(error, null, 2));
      console.error('❌ Gönderilen veri:', JSON.stringify(flightTicketData, null, 2));

      // Eğer kur veya toplam_tl alanı yoksa, bu alanları kaldır ve tekrar dene
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.log('⚠️ Kur veya toplam_tl alanı bulunamadı, bu alanları kaldırıp tekrar deniyoruz...');
        delete flightTicketData.kur;
        delete flightTicketData.toplam_tl;

        const { data: retryData, error: retryError } = await client
          .from('project_flight_tickets')
          .insert([flightTicketData])
          .select()
          .single();

        if (retryError) {
          console.error('❌ Tekrar deneme hatası:', retryError);
          return res.status(500).json({
            error: 'Uçak bileti oluşturulamadı',
            details: retryError.message,
            code: retryError.code
          });
        }

        console.log('✅ Tekrar deneme başarılı:', retryData);
        return res.status(201).json(retryData);
      }

      return res.status(500).json({
        error: 'Uçak bileti oluşturulamadı',
        details: error.message,
        code: error.code
      });
    }

    console.log('Başarılı oluşturma:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('Uçak bileti oluşturma hatası:', error);
    console.error('Hata stack:', error.stack);
    res.status(500).json({
      error: 'Sunucu hatası',
      details: error.message
    });
  }
});

// Uçak bileti güncelle
router.put('/:projectId/:id', async (req, res) => {
  try {
    const { projectId, id } = req.params;

    // Sadece mevcut alanları kullan
    const allowedFields = [
      'biletleme_tarihi', 'tedarikci', 'havayolu', 'pnr', 'ucus_tipi',
      'gidis_tarihi', 'gidis_saati', 'gidis_ucus_kodu',
      'donus_tarihi', 'donus_saati', 'donus_ucus_kodu',
      'guzergah', 'kisi_sayisi', 'pp_maliyet', 'toplam_maliyet',
      'doviz', 'misafirler', 'durum', 'islemler',
      'satis_pax', 'pp_satis', 'toplam_satis', 'doviz_satis', 
      'satis_kur', 'toplam_satis_tl', 'satis_doviz', 'hotel_id'
    ];

    const updateData = {};

    // Mevcut alanları ekle
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        // Boş string kontrolü - sadece ucus_tipi için boş string'e izin ver
        if (field === 'ucus_tipi' || req.body[field] !== '') {
          updateData[field] = req.body[field];
        }
      }
    });

    // Yeni alanları ekle (eğer tabloda varsa)
    if (req.body.kur !== undefined && req.body.kur !== null) {
      updateData.kur = req.body.kur;
    }
    if (req.body.toplam_tl !== undefined && req.body.toplam_tl !== null) {
      updateData.toplam_tl = req.body.toplam_tl;
    }

    console.log('🔵 Backend PUT: req.body.ucus_tipi:', req.body.ucus_tipi);
    console.log('🔵 Backend PUT: updateData.ucus_tipi:', updateData.ucus_tipi);
    console.log('🔵 Backend PUT: Hazırlanan veri:', JSON.stringify(updateData, null, 2));

    // Service role client kullan (RLS bypass)
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('project_flight_tickets')
      .update(updateData)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('❌ Uçak bileti güncelleme hatası:', error);
      console.error('❌ Hata detayları:', JSON.stringify(error, null, 2));
      console.error('❌ Gönderilen veri:', JSON.stringify(updateData, null, 2));

      // Eğer kur veya toplam_tl alanı yoksa, bu alanları kaldır ve tekrar dene
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.log('⚠️ Kur veya toplam_tl alanı bulunamadı, bu alanları kaldırıp tekrar deniyoruz...');
        delete updateData.kur;
        delete updateData.toplam_tl;

        const { data: retryData, error: retryError } = await client
          .from('project_flight_tickets')
          .update(updateData)
          .eq('id', id)
          .eq('project_id', projectId)
          .select()
          .single();

        if (retryError) {
          console.error('❌ Tekrar deneme hatası:', retryError);
          return res.status(500).json({
            error: 'Uçak bileti güncellenemedi',
            details: retryError.message,
            code: retryError.code
          });
        }

        console.log('✅ Tekrar deneme başarılı:', retryData);
        return res.json(retryData);
      }

      return res.status(500).json({
        error: 'Uçak bileti güncellenemedi',
        details: error.message,
        code: error.code
      });
    }

    if (!data) {
      return res.status(404).json({ error: 'Uçak bileti bulunamadı' });
    }

    res.json(data);
  } catch (error) {
    console.error('Uçak bileti güncelleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Uçak bileti sil
router.delete('/:projectId/:id', async (req, res) => {
  try {
    const { projectId, id } = req.params;

    // Service role client kullan (RLS bypass)
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('project_flight_tickets')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);

    if (error) {
      console.error('Uçak bileti silme hatası:', error);
      return res.status(500).json({ error: 'Uçak bileti silinemedi' });
    }

    res.json({ message: 'Uçak bileti başarıyla silindi' });
  } catch (error) {
    console.error('Uçak bileti silme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Toplu uçak bileti silme (proje bazında)
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Service role client kullan (RLS bypass)
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('project_flight_tickets')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      console.error('Uçak biletleri toplu silme hatası:', error);
      return res.status(500).json({ error: 'Uçak biletleri silinemedi' });
    }

    res.json({ message: 'Tüm uçak biletleri başarıyla silindi' });
  } catch (error) {
    console.error('Uçak biletleri toplu silme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Excel'den toplu uçak bileti içe aktarma
router.post('/:projectId/import', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { flightTickets } = req.body;

    if (!Array.isArray(flightTickets)) {
      return res.status(400).json({ error: 'Geçersiz veri formatı' });
    }

    // Verileri proje ID'si ile zenginleştir
    const ticketsWithProjectId = flightTickets.map(ticket => ({
      ...ticket,
      project_id: projectId
    }));

    // Service role client kullan (RLS bypass)
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('project_flight_tickets')
      .insert(ticketsWithProjectId)
      .select();

    if (error) {
      console.error('Uçak biletleri toplu ekleme hatası:', error);
      return res.status(500).json({ error: 'Uçak biletleri eklenemedi' });
    }

    res.status(201).json({
      message: `${data.length} uçak bileti başarıyla eklendi`,
      count: data.length
    });
  } catch (error) {
    console.error('Uçak biletleri toplu ekleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
