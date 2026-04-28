const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm şirketleri getir (admin için)
router.get('/', async (req, res) => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Şirketler getirilemedi' });
    }

    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şirket detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !company) {
      return res.status(404).json({ message: 'Şirket bulunamadı' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şirket güncelle
router.put('/:id', [
  body('name').notEmpty().trim(),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('website').optional().trim(),
  body('tax_number').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();

    const { data: company, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !company) {
      return res.status(404).json({ message: 'Şirket bulunamadı' });
    }

    res.json(company);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şirket istatistikleri
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Kullanıcı sayısı
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);

    // Etkinlik sayısı
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);

    // Proje sayısı
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);

    // Müşteri sayısı
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);

    // Toplam gelir (son 30 gün)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTransactions } = await supabase
      .from('financial_transactions')
      .select('amount, type')
      .eq('company_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const totalRevenue = recentTransactions
      ?.filter(t => t.type === 'income')
      ?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    const totalExpense = recentTransactions
      ?.filter(t => t.type === 'expense')
      ?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    res.json({
      userCount: userCount || 0,
      eventCount: eventCount || 0,
      projectCount: projectCount || 0,
      customerCount: customerCount || 0,
      recentRevenue: totalRevenue,
      recentExpense: totalExpense,
      recentProfit: totalRevenue - totalExpense
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şirket ayarları
router.get('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !company) {
      return res.status(404).json({ message: 'Şirket bulunamadı' });
    }

    // Şirket ayarlarını döndür
    res.json({
      company,
      settings: {
        currency: company.currency || 'TRY',
        timezone: company.timezone || 'Europe/Istanbul',
        dateFormat: company.date_format || 'DD/MM/YYYY',
        language: company.language || 'tr',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    });
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şirket ayarlarını güncelle
router.put('/:id/settings', [
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('timezone').optional().notEmpty(),
  body('dateFormat').optional().notEmpty(),
  body('language').optional().isIn(['tr', 'en']),
  body('notifications').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { currency, timezone, dateFormat, language, notifications } = req.body;

    const updateData = {
      currency: currency || undefined,
      timezone: timezone || undefined,
      date_format: dateFormat || undefined,
      language: language || undefined,
      updated_at: new Date().toISOString()
    };

    const { data: company, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !company) {
      return res.status(404).json({ message: 'Şirket bulunamadı' });
    }

    res.json({
      company,
      settings: {
        currency: company.currency,
        timezone: company.timezone,
        dateFormat: company.date_format,
        language: company.language,
        notifications
      }
    });
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 