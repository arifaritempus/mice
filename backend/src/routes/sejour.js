const express = require('express');
const router = express.Router();

// GET /sejour - Sejour ana sayfası (frontend için)
router.get('/sejour', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Sejour ana sayfası erişilebilir'
    });
  } catch (error) {
    console.error('Sejour ana sayfası hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sejour ana sayfası erişilemedi',
      error: error.message
    });
  }
});

// GET /api/sejour - Sejour listesi
router.get('/', async (req, res) => {
  try {
    const { status, limit = 10 } = req.query;
    
    // Mock data - gerçek veritabanı entegrasyonu için değiştirilecek
    const mockSejours = [
      {
        id: '1',
        name: 'İstanbul Konferans Sejour',
        hotel_name: 'Grand Hotel',
        start_date: '2025-09-15',
        end_date: '2025-09-18',
        guest_count: 150,
        total_cost: 45000,
        status: 'confirmed'
      }
    ];

    let filteredSejours = mockSejours;
    
    if (status) {
      filteredSejours = mockSejours.filter(sejour => sejour.status === status);
    }

    if (limit) {
      filteredSejours = filteredSejours.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: filteredSejours,
      total: filteredSejours.length,
      message: 'Sejour verileri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Sejour listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sejour verileri getirilemedi',
      error: error.message
    });
  }
});

// GET /api/sejour/services - Sejour hizmet listesi (konfirme olanlar)
router.get('/services', async (req, res) => {
  try {
    const { voucher, from, to } = req.query;
    
    // Gerçek sejour verilerini localStorage'dan oku (frontend'den gelen veri)
    // Bu veriler sejour sayfasındaki gerçek rezervasyonlardan geliyor
    let sejourData = [];
    
    try {
      // Frontend'den localStorage verisi geliyorsa onu kullan
      if (req.headers['x-sejour-data']) {
        sejourData = JSON.parse(req.headers['x-sejour-data']);
      }
    } catch (e) {
      console.log('Frontend sejour data parse edilemedi, mock data kullanılıyor');
    }
    
    // Eğer gerçek veri yoksa mock data kullan
    if (!sejourData || sejourData.length === 0) {
      sejourData = [
        {
          id: '1',
          voucherNumber: 'TFI250822001',
          customerType: 'agency',
          customerName: 'LA TOUR',
          agencyName: 'LA TOUR',
          checkInDate: '2025-10-01',
          checkOutDate: '2025-10-03',
          rooms: [
            {
              hotelId: '1',
              roomType: 'Standart Oda',
              accommodationType: 'Yarım Pansiyon',
              guestInfo: 'ANILAY ACIKAVAK, DOGA AYDIN'
            }
          ],
          totals: { TRY: 72000, USD: 0, EUR: 0 },
          status: 'konfirme',
          currency: 'TRY'
        },
        {
          id: '2',
          voucherNumber: 'TFI250822002',
          customerType: 'agency',
          customerName: 'LA TOUR',
          agencyName: 'LA TOUR',
          checkInDate: '2025-11-01',
          checkOutDate: '2025-11-03',
          rooms: [
            {
              hotelId: '2',
              roomType: 'Deluxe Oda',
              accommodationType: 'Tam Pansiyon',
              guestInfo: 'ANILAY ACIKAVAK'
            }
          ],
          totals: { TRY: 32000, USD: 0, EUR: 0 },
          status: 'konfirme',
          currency: 'TRY'
        },
        {
          id: '3',
          voucherNumber: 'TFI250823001',
          customerType: 'customer',
          customerName: 'MEHMET DOGAN SERGIN',
          agencyName: '',
          checkInDate: '2025-11-01',
          checkOutDate: '2025-11-03',
          rooms: [
            {
              hotelId: '3',
              roomType: 'Suite',
              accommodationType: 'Ultra Her Şey Dahil',
              guestInfo: 'MEHMET DOGAN SERGIN, SEVNUR SERGIN'
            }
          ],
          totals: { TRY: 60000, USD: 0, EUR: 0 },
          status: 'konfirme',
          currency: 'TRY'
        },
        {
          id: '4',
          voucherNumber: 'TFI250823004',
          customerType: 'agency',
          customerName: 'LA TOUR',
          agencyName: 'LA TOUR',
          checkInDate: '2025-12-01',
          checkOutDate: '2025-12-03',
          rooms: [
            {
              hotelId: '4',
              roomType: 'Standart Oda',
              accommodationType: 'Yarım Pansiyon',
              guestInfo: 'CIHAT YALCIN'
            }
          ],
          totals: { TRY: 53000, USD: 0, EUR: 0 },
          status: 'konfirme',
          currency: 'TRY'
        },
        {
          id: '5',
          voucherNumber: 'TFI250824001',
          customerType: 'agency',
          customerName: 'TRAVEL PRO',
          agencyName: 'TRAVEL PRO',
          checkInDate: '2025-12-15',
          checkOutDate: '2025-12-18',
          rooms: [
            {
              hotelId: '5',
              roomType: 'Business Oda',
              accommodationType: 'Kahvaltı Dahil',
              guestInfo: 'AHMET YILMAZ'
            }
          ],
          totals: { TRY: 45000, USD: 0, EUR: 0 },
          status: 'bekleyen', // Bekleyen status - filtrelenecek
          currency: 'TRY'
        }
      ];
    }
    
    // Sadece konfirme olanları filtrele
    const confirmedSejours = sejourData.filter(sejour => {
      const status = (sejour.status || '').toString().toLowerCase();
      return status.includes('konf') || status.includes('confirm');
    });
    
    // Sejour verilerini hizmet formatına çevir
    const services = confirmedSejours.map(sejour => {
      // Otel bilgisini al (ilk odadan)
      let hotelName = '';
      let roomType = '';
      let boardType = '';
      let guestNames = [];
      
      if (sejour.rooms && sejour.rooms.length > 0) {
        const firstRoom = sejour.rooms[0];
        // Mock otel listesi
        const mockHotels = [
          { id: '1', name: 'Grand Hotel Istanbul' },
          { id: '2', name: 'Business Hotel Ankara' },
          { id: '3', name: 'Resort Hotel Antalya' },
          { id: '4', name: 'City Hotel Izmir' },
          { id: '5', name: 'Holiday Inn Istanbul' }
        ];
        
        const hotel = mockHotels.find(h => h.id === firstRoom.hotelId);
        hotelName = hotel ? hotel.name : firstRoom.hotelId || '';
        roomType = firstRoom.roomType || '';
        boardType = firstRoom.accommodationType || '';
        
        // Misafir bilgilerini topla
        if (firstRoom.guestInfo) {
          guestNames = firstRoom.guestInfo.split(', ');
        }
      }

      // Toplam tutarları hesapla
      const totals = sejour.totals || { TRY: 0, USD: 0, EUR: 0 };
      const mainCurrency = Object.keys(totals).reduce((a, b) => 
        totals[a] > totals[b] ? a : b
      );
      
      const totalAmount = totals[mainCurrency] || 0;

      return {
        voucherNumber: sejour.voucherNumber || '',
        customerType: sejour.customerType || 'customer',
        customerName: sejour.customerType === 'agency' ? (sejour.agencyName || '') : (sejour.customerName || ''),
        checkInDate: sejour.checkInDate || '',
        checkOutDate: sejour.checkOutDate || '',
        hotelName: hotelName || '-',
        guestName: guestNames.length > 0 ? guestNames.join(', ') : '-',
        boardType: boardType || '-',
        roomType: roomType || '-',
        accommodationAmount: Math.floor(totalAmount * 0.6), // %60 konaklama
        accommodationCurrency: mainCurrency,
        flightAmount: Math.floor(totalAmount * 0.3), // %30 uçuş
        flightCurrency: mainCurrency,
        transferAmount: Math.floor(totalAmount * 0.07), // %7 transfer
        transferCurrency: mainCurrency,
        extraAmount: Math.floor(totalAmount * 0.03), // %3 ekstra
        extraCurrency: mainCurrency,
        totalAmount: totalAmount,
        totalCurrency: mainCurrency
      };
    });

    let filteredServices = services;
    
    // Voucher filtresi
    if (voucher) {
      filteredServices = filteredServices.filter(service => 
        service.voucherNumber.toLowerCase().includes(voucher.toLowerCase()) ||
        service.customerName.toLowerCase().includes(voucher.toLowerCase()) ||
        service.guestName.toLowerCase().includes(voucher.toLowerCase())
      );
    }
    
    // Tarih filtresi
    if (from) {
      filteredServices = filteredServices.filter(service => 
        new Date(service.checkInDate) >= new Date(from)
      );
    }
    
    if (to) {
      filteredServices = filteredServices.filter(service => 
        new Date(service.checkOutDate) <= new Date(to)
      );
    }

    res.json({
      success: true,
      data: filteredServices,
      total: filteredServices.length,
      message: 'Sejour hizmet listesi başarıyla getirildi'
    });
  } catch (error) {
    console.error('Sejour hizmet listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sejour hizmet listesi getirilemedi',
      error: error.message
    });
  }
});

// GET /api/sejour/:id - Tek sejour detayı
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data
    const sejour = {
      id,
      name: 'İstanbul Konferans Sejour',
      hotel_name: 'Grand Hotel',
      start_date: '2025-09-15',
      end_date: '2025-09-18',
      guest_count: 150,
      total_cost: 45000,
      status: 'confirmed',
      description: 'Yıllık teknoloji konferansı için sejour planlaması',
      created_at: '2025-08-27T10:00:00Z',
      updated_at: '2025-08-27T10:00:00Z'
    };

    res.json({
      success: true,
      data: sejour,
      message: 'Sejour detayı başarıyla getirildi'
    });
  } catch (error) {
    console.error('Sejour detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sejour detayı getirilemedi',
      error: error.message
    });
  }
});

// POST /api/sejour - Yeni sejour oluştur
router.post('/', async (req, res) => {
  try {
    const sejourData = req.body;
    
    // Validation
    if (!sejourData.name || !sejourData.hotel_name || !sejourData.start_date) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik'
      });
    }

    // Mock response
    const newSejour = {
      id: Date.now().toString(),
      ...sejourData,
      status: sejourData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newSejour,
      message: 'Sejour başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Sejour oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sejour oluşturulamadı',
      error: error.message
    });
  }
});

// PUT /api/sejour/:id - Sejour güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock response
    const updatedSejour = {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedSejour,
      message: 'Sejour başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Sejour güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sejour güncellenemedi',
      error: error.message
    });
  }
});

// DELETE /api/sejour/:id - Sejour sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: `Sejour ${id} başarıyla silindi`
    });
  } catch (error) {
    console.error('Sejour silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sejour silinemedi',
      error: error.message
    });
  }
});

module.exports = router;
