const express = require('express');
const { supabase } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Tüm route'lar için auth middleware kullan
router.use(authMiddleware);

// Proje transferlerini getir
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { search, direction, supplier_id } = req.query;

    let query = supabase
      .from('project_transfer_tour')
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `)
      .eq('project_id', projectId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    // Arama filtresi
    if (search) {
      query = query.or(`route.ilike.%${search}%,flight_code.ilike.%${search}%,supplier_name.ilike.%${search}%`);
    }

    // Yön filtresi
    if (direction) {
      query = query.eq('direction', direction);
    }

    // Tedarikçi filtresi
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    const { data: transfers, error } = await query;

    if (error) {
      console.error('Transfer getirme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Transfer verileri getirilemedi',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: transfers,
      total: transfers.length,
      message: 'Transfer verileri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Transfer getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer verileri getirilemedi',
      error: error.message
    });
  }
});

// Yeni transfer oluştur
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const transferData = req.body;

    // Transfer verilerini hazırla
    const newTransfer = {
      project_id: projectId,
      direction: transferData.direction || 'arrival',
      type_label: transferData.type_label,
      date: transferData.date,
      time: transferData.time,
      flight_code: transferData.flight_code,
      route: transferData.route,
      passenger_count: transferData.passenger_count || 1,
      passengers: transferData.passengers || [],
      transfer_type: transferData.transfer_type || 'private',
      vehicle_type: transferData.vehicle_type,
      supplier_id: transferData.supplier_id,
      supplier_name: transferData.supplier_name,
      vehicle_assigned: transferData.vehicle_assigned || false,
      cost_amount: transferData.cost_amount,
      currency: transferData.currency || 'TRY',
      is_group: transferData.is_group || false,
      group_transfers: transferData.group_transfers,
      sort_key: `${transferData.date || '9999-12-31'} ${transferData.time || '23:59'}`,
      created_by: req.user.id
    };

    const { data: transfer, error } = await supabase
      .from('project_transfer_tour')
      .insert([newTransfer])
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `)
      .single();

    if (error) {
      console.error('Transfer oluşturma hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Transfer oluşturulamadı',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: transfer,
      message: 'Transfer başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Transfer oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer oluşturulamadı',
      error: error.message
    });
  }
});

// Transfer güncelle
router.put('/:projectId/:transferId', async (req, res) => {
  try {
    const { projectId, transferId } = req.params;
    const updateData = req.body;

    // Sort key'i güncelle
    if (updateData.date || updateData.time) {
      updateData.sort_key = `${updateData.date || '9999-12-31'} ${updateData.time || '23:59'}`;
    }

    const { data: transfer, error } = await supabase
      .from('project_transfer_tour')
      .update(updateData)
      .eq('id', transferId)
      .eq('project_id', projectId)
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `)
      .single();

    if (error) {
      console.error('Transfer güncelleme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Transfer güncellenemedi',
        error: error.message
      });
    }

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer bulunamadı'
      });
    }

    res.json({
      success: true,
      data: transfer,
      message: 'Transfer başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Transfer güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer güncellenemedi',
      error: error.message
    });
  }
});

// Transfer sil
router.delete('/:projectId/:transferId', async (req, res) => {
  try {
    const { projectId, transferId } = req.params;

    const { error } = await supabase
      .from('project_transfer_tour')
      .delete()
      .eq('id', transferId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Transfer silme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Transfer silinemedi',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Transfer başarıyla silindi'
    });
  } catch (error) {
    console.error('Transfer silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer silinemedi',
      error: error.message
    });
  }
});

// Toplu transfer silme
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { transferIds } = req.body;

    if (!transferIds || !Array.isArray(transferIds) || transferIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Silinecek transfer ID\'leri belirtilmelidir'
      });
    }

    const { error } = await supabase
      .from('project_transfer_tour')
      .delete()
      .in('id', transferIds)
      .eq('project_id', projectId);

    if (error) {
      console.error('Toplu transfer silme hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Transferler silinemedi',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: `${transferIds.length} transfer başarıyla silindi`
    });
  } catch (error) {
    console.error('Toplu transfer silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transferler silinemedi',
      error: error.message
    });
  }
});

// Transfer istatistikleri
router.get('/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Döviz bazında toplam hesaplamaları
    const { data: transfers, error } = await supabase
      .from('project_transfer_tour')
      .select('passenger_count, cost_amount, currency')
      .eq('project_id', projectId);

    if (error) {
      console.error('Transfer istatistik hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Transfer istatistikleri getirilemedi',
        error: error.message
      });
    }

    // Döviz bazında toplam hesaplamaları
    const totalsByCurrency = {};
    transfers.forEach(transfer => {
      const currency = transfer.currency || 'TRY';
      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = {
          kisiSayisi: 0,
          toplamMaliyet: 0
        };
      }
      totalsByCurrency[currency].kisiSayisi += transfer.passenger_count || 0;
      totalsByCurrency[currency].toplamMaliyet += transfer.cost_amount || 0;
    });

    res.json({
      success: true,
      data: {
        totalsByCurrency,
        totalTransfers: transfers.length
      },
      message: 'Transfer istatistikleri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Transfer istatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer istatistikleri getirilemedi',
      error: error.message
    });
  }
});

// Konaklama verilerinden transfer oluştur
router.post('/:projectId/from-accommodation', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { accommodationData } = req.body;

    if (!accommodationData || !Array.isArray(accommodationData)) {
      return res.status(400).json({
        success: false,
        message: 'Konaklama verileri gerekli'
      });
    }

    const transfers = [];

    for (const accommodation of accommodationData) {
      // Giriş transferi
      if (accommodation.giris_tarihi && accommodation.gelis_ucus_kodu) {
        transfers.push({
          project_id: projectId,
          direction: 'arrival',
          type_label: 'Giriş',
          date: accommodation.giris_tarihi,
          time: accommodation.gelis_ucus_iniş || '12:00',
          flight_code: accommodation.gelis_ucus_kodu,
          route: `Havalimanı → ${accommodation.otel || 'Otel'}`,
          passenger_count: 1,
          passengers: [accommodation.isim ? `${accommodation.isim} ${accommodation.soyisim || ''}`.trim() : ''],
          transfer_type: 'private',
          vehicle_type: '',
          cost_amount: 0,
          currency: 'TRY',
          sort_key: `${accommodation.giris_tarihi} ${accommodation.gelis_ucus_iniş || '12:00'}`,
          created_by: req.user.id
        });
      }

      // Çıkış transferi
      if (accommodation.cikis_tarihi && accommodation.donus_ucus_kodu) {
        transfers.push({
          project_id: projectId,
          direction: 'departure',
          type_label: 'Çıkış',
          date: accommodation.cikis_tarihi,
          time: accommodation.donus_ucus_kalkis || '12:00',
          flight_code: accommodation.donus_ucus_kodu,
          route: `${accommodation.otel || 'Otel'} → Havalimanı`,
          passenger_count: 1,
          passengers: [accommodation.isim ? `${accommodation.isim} ${accommodation.soyisim || ''}`.trim() : ''],
          transfer_type: 'private',
          vehicle_type: '',
          cost_amount: 0,
          currency: 'TRY',
          sort_key: `${accommodation.cikis_tarihi} ${accommodation.donus_ucus_kalkis || '12:00'}`,
          created_by: req.user.id
        });
      }
    }

    if (transfers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Konaklama verilerinden transfer oluşturulamadı'
      });
    }

    const { data: createdTransfers, error } = await supabase
      .from('project_transfer_tour')
      .insert(transfers)
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `);

    if (error) {
      console.error('Konaklama transfer oluşturma hatası:', error);
      return res.status(500).json({
        success: false,
        message: 'Transferler oluşturulamadı',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: createdTransfers,
      message: `${createdTransfers.length} transfer başarıyla oluşturuldu`
    });
  } catch (error) {
    console.error('Konaklama transfer oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transferler oluşturulamadı',
      error: error.message
    });
  }
});

module.exports = router;
