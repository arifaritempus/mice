const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Proje etkinliklerini getir
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { search, sort_by = 'event_date', sort_order = 'desc' } = req.query;
    
    console.log('Getting events for project:', projectId);
    
    let query = supabase
      .from('project_events_activities')
      .select(`
        *,
        supplier:suppliers(name, type),
        sub_category:categories(name),
        created_by_user:users(first_name, last_name)
      `)
      .eq('project_id', projectId);
    
    if (search) {
      query = query.or(`description.ilike.%${search}%`);
    }
    
    const { data: events, error } = await query
      .order(sort_by, { ascending: sort_order === 'asc' });
    
    if (error) {
      console.error('Get project events error:', error);
      return res.status(500).json({ message: 'Etkinlikler getirilemedi', error: error.message });
    }
    
    console.log('Events found:', events?.length || 0);
    res.json(events || []);
  } catch (error) {
    console.error('Get project events error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Etkinlik oluştur
router.post('/', async (req, res) => {
  try {
    console.log('Creating event with data:', req.body);
    
    const eventData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const { data: event, error } = await supabase
      .from('project_events_activities')
      .insert([eventData])
      .select(`
        *,
        supplier:suppliers(name, type),
        sub_category:categories(name),
        created_by_user:users(first_name, last_name)
      `)
      .single();
    
    if (error) {
      console.error('Create event error:', error);
      return res.status(500).json({ message: 'Etkinlik oluşturulamadı', error: error.message });
    }
    
    console.log('Event created successfully:', event);
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Etkinlik güncelle
router.put('/:id', [
  body('event_date').optional().isISO8601().toDate(),
  body('supplier_id').optional().isUUID(),
  body('supplier_type').optional().isIn(['hotel', 'supplier']),
  body('sub_category_id').optional().isUUID(),
  body('description').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('currency').optional().isLength({ min: 3, max: 10 }),
  body('exchange_rate').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const { data: event, error } = await supabase
      .from('project_events_activities')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(name, type),
        sub_category:categories(name),
        created_by_user:users(first_name, last_name)
      `)
      .single();
    
    if (error) {
      console.error('Update event error:', error);
      return res.status(500).json({ message: 'Etkinlik güncellenemedi' });
    }
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('project_events_activities')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete event error:', error);
      return res.status(500).json({ message: 'Etkinlik silinemedi' });
    }
    
    res.json({ message: 'Etkinlik başarıyla silindi' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: event, error } = await supabase
      .from('project_events_activities')
      .select(`
        *,
        supplier:suppliers(name, type),
        sub_category:categories(name),
        created_by_user:users(first_name, last_name)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Get event error:', error);
      return res.status(500).json({ message: 'Etkinlik getirilemedi' });
    }
    
    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Proje etkinlik istatistikleri
router.get('/project/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const { data: events, error } = await supabase
      .from('project_events_activities')
      .select('amount, currency, exchange_rate, total_tl')
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({ message: 'İstatistikler getirilemedi' });
    }
    
    const totalEvents = events?.length || 0;
    const totalAmount = events?.reduce((sum, event) => sum + parseFloat(event.amount || 0), 0) || 0;
    const totalTL = events?.reduce((sum, event) => sum + parseFloat(event.total_tl || 0), 0) || 0;
    
    // Döviz bazında toplamlar
    const currencyTotals = events?.reduce((acc, event) => {
      const currency = event.currency || 'EUR';
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += parseFloat(event.amount || 0);
      return acc;
    }, {}) || {};
    
    const stats = {
      totalEvents,
      totalAmount,
      totalTL,
      currencyTotals,
      averageAmount: totalEvents > 0 ? totalAmount / totalEvents : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
