const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Dashboard ana veri endpoint'i
router.post('/data', authMiddleware, async (req, res) => {
  try {
    const { period = 'month' } = req.body;
    
    // Burada gerçek veritabanı sorguları yapılacak
    // Şimdilik örnek veriler döndürüyoruz
    
    const projects = [
      {
        id: '1',
        name: 'Tech Conference 2025',
        status: 'active',
        start_date: '2025-09-15',
        end_date: '2025-09-18',
        client_name: 'TechCorp',
        budget: 50000,
        revenue: 75000
      },
      {
        id: '2',
        name: 'Medical Summit',
        status: 'active',
        start_date: '2025-10-20',
        end_date: '2025-10-22',
        client_name: 'MedGroup',
        budget: 35000,
        revenue: 45000
      }
    ];

    const sejours = [
      {
        id: '1',
        name: 'Luxury Resort Package',
        hotel_name: 'Concorde Luxury Resort',
        start_date: '2025-09-10',
        end_date: '2025-09-15',
        guest_count: 45,
        total_cost: 22500,
        status: 'confirmed'
      },
      {
        id: '2',
        name: 'Business Conference Stay',
        hotel_name: 'Grand Hotel Istanbul',
        start_date: '2025-10-15',
        end_date: '2025-10-18',
        guest_count: 28,
        total_cost: 16800,
        status: 'pending'
      }
    ];

    const transfers = [
      {
        id: '1',
        type: 'Airport Transfer',
        pickup_location: 'Antalya Airport',
        dropoff_location: 'Concorde Resort',
        date: '2025-09-10',
        guest_count: 45,
        cost: 4500,
        status: 'confirmed'
      },
      {
        id: '2',
        type: 'City Tour Transfer',
        pickup_location: 'Grand Hotel',
        dropoff_location: 'Historical Sites',
        date: '2025-10-16',
        guest_count: 28,
        cost: 2800,
        status: 'pending'
      }
    ];

    const tickets = [
      {
        id: '1',
        flight_number: 'TK1234',
        departure: 'Istanbul',
        arrival: 'Antalya',
        date: '2025-09-10',
        passenger_count: 45,
        cost: 13500,
        status: 'confirmed'
      },
      {
        id: '2',
        flight_number: 'TK5678',
        departure: 'Ankara',
        arrival: 'Istanbul',
        date: '2025-10-15',
        passenger_count: 28,
        cost: 8400,
        status: 'pending'
      }
    ];

    const guides = [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        service_date: '2025-09-12',
        location: 'Antalya',
        guest_count: 45,
        cost: 2250,
        status: 'confirmed'
      },
      {
        id: '2',
        name: 'Fatma Demir',
        service_date: '2025-10-17',
        location: 'Istanbul',
        guest_count: 28,
        cost: 1400,
        status: 'pending'
      }
    ];

    const partTimes = [
      {
        id: '1',
        name: 'Mehmet Kaya',
        service_date: '2025-09-11',
        location: 'Antalya',
        hours: 8,
        hourly_rate: 50,
        status: 'confirmed'
      },
      {
        id: '2',
        name: 'Ayşe Özkan',
        service_date: '2025-10-16',
        location: 'Istanbul',
        hours: 6,
        hourly_rate: 45,
        status: 'pending'
      }
    ];

    const userLogs = [
      {
        id: '1',
        user_name: 'admin@eventiq.com',
        action: 'LOGIN',
        module: 'Authentication',
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.100',
        details: 'Başarılı giriş'
      },
      {
        id: '2',
        user_name: 'manager@eventiq.com',
        action: 'CREATE',
        module: 'Projects',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        ip_address: '192.168.1.101',
        details: 'Yeni proje oluşturuldu: Tech Conference 2025'
      },
      {
        id: '3',
        user_name: 'operator@eventiq.com',
        action: 'UPDATE',
        module: 'Sejour',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        ip_address: '192.168.1.102',
        details: 'Sejour rezervasyonu güncellendi: Luxury Resort Package'
      }
    ];

    // Finansal özet hesaplama
    const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
    const totalExpenses = sejours.reduce((sum, s) => sum + s.total_cost, 0) +
                         transfers.reduce((sum, t) => sum + t.cost, 0) +
                         tickets.reduce((sum, t) => sum + t.cost, 0) +
                         guides.reduce((sum, g) => sum + g.cost, 0) +
                         partTimes.reduce((sum, pt) => sum + (pt.hours * pt.hourly_rate), 0);
    
    const financialSummary = {
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      profit_margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      monthly_growth: 12.5 // Örnek büyüme oranı
    };

    res.json({
      success: true,
      data: {
        projects,
        sejours,
        transfers,
        tickets,
        guides,
        partTimes,
        userLogs,
        financialSummary
      }
    });

  } catch (error) {
    console.error('Dashboard veri çekme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard verileri alınırken hata oluştu',
      error: error.message
    });
  }
});

// Kullanıcı log kayıtları endpoint'i
router.get('/user-logs', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0, user_id, action, module } = req.query;
    
    // Burada gerçek veritabanı sorgusu yapılacak
    // Şimdilik örnek veriler döndürüyoruz
    
    const userLogs = [
      {
        id: '1',
        user_name: 'admin@eventiq.com',
        action: 'LOGIN',
        module: 'Authentication',
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.100',
        details: 'Başarılı giriş'
      },
      {
        id: '2',
        user_name: 'manager@eventiq.com',
        action: 'CREATE',
        module: 'Projects',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        ip_address: '192.168.1.101',
        details: 'Yeni proje oluşturuldu: Tech Conference 2025'
      },
      {
        id: '3',
        user_name: 'operator@eventiq.com',
        action: 'UPDATE',
        module: 'Sejour',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        ip_address: '192.168.1.102',
        details: 'Sejour rezervasyonu güncellendi: Luxury Resort Package'
      }
    ];

    res.json({
      success: true,
      data: {
        logs: userLogs,
        total: userLogs.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Kullanıcı log kayıtları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı log kayıtları alınırken hata oluştu',
      error: error.message
    });
  }
});

// Finansal rapor endpoint'i
router.get('/financial-report', authMiddleware, async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;
    
    // Burada gerçek veritabanı sorgusu yapılacak
    // Şimdilik örnek veriler döndürüyoruz
    
    const financialData = {
      period: period,
      start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: end_date || new Date().toISOString(),
      revenue: {
        total: 120000,
        by_category: {
          projects: 75000,
          sejours: 25000,
          transfers: 8000,
          tickets: 12000
        }
      },
      expenses: {
        total: 85000,
        by_category: {
          hotels: 40000,
          transportation: 20000,
          services: 15000,
          other: 10000
        }
      },
      profit: 35000,
      profit_margin: 29.17
    };

    res.json({
      success: true,
      data: financialData
    });

  } catch (error) {
    console.error('Finansal rapor hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Finansal rapor alınırken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router; 