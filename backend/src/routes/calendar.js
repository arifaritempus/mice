const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Takvim etkinliklerini getir
router.get('/events', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { start_date, end_date, type, user_id } = req.query;
    
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users(name, email, avatar_url),
        assigned_users:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id);
    
    if (start_date) query = query.gte('start_date', start_date);
    if (end_date) query = query.lte('end_date', end_date);
    if (type) query = query.eq('type', type);
    if (user_id) query = query.eq('assigned_to', user_id);
    
    const { data: events, error } = await query.order('start_date', { ascending: true });
    if (error) return res.status(500).json({ message: 'Takvim etkinlikleri getirilemedi' });
    
    res.json(events);
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takvim etkinliği oluştur
router.post('/events', [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('type').isIn(['meeting', 'task', 'event', 'reminder', 'deadline']),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']),
  body('location').optional().trim(),
  body('assigned_to').optional().isArray(),
  body('is_all_day').optional().isBoolean(),
  body('color').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const eventData = req.body;
    
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert([{
        ...eventData,
        company_id,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Takvim etkinliği oluşturulamadı' });
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takvim etkinliği detayını getir
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users(name, email, avatar_url),
        assigned_users:users(name, email, avatar_url)
      `)
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !event) {
      return res.status(404).json({ message: 'Takvim etkinliği bulunamadı' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get calendar event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takvim etkinliğini güncelle
router.put('/events/:id', [
  body('title').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('type').optional().isIn(['meeting', 'task', 'event', 'reminder', 'deadline']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('location').optional().trim(),
  body('assigned_to').optional().isArray(),
  body('is_all_day').optional().isBoolean(),
  body('color').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    
    const { data: event, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    
    if (error || !event) {
      return res.status(404).json({ message: 'Takvim etkinliği bulunamadı' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takvim etkinliğini sil
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    
    if (error) return res.status(500).json({ message: 'Takvim etkinliği silinemedi' });
    
    res.json({ message: 'Takvim etkinliği başarıyla silindi' });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının takvim etkinliklerini getir
router.get('/my-events', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { start_date, end_date, type } = req.query;
    
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id)
      .or(`created_by.eq.${req.user.id},assigned_to.cs.{${req.user.id}}`);
    
    if (start_date) query = query.gte('start_date', start_date);
    if (end_date) query = query.lte('end_date', end_date);
    if (type) query = query.eq('type', type);
    
    const { data: events, error } = await query.order('start_date', { ascending: true });
    if (error) return res.status(500).json({ message: 'Kişisel etkinlikler getirilemedi' });
    
    res.json(events);
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takvim görünümü için etkinlikleri getir (aylık, haftalık, günlük)
router.get('/view/:view', async (req, res) => {
  try {
    const { view } = req.params;
    const { company_id } = req.user;
    const { date, user_id } = req.query;
    
    let startDate, endDate;
    const baseDate = date ? new Date(date) : new Date();
    
    switch (view) {
      case 'day':
        startDate = new Date(baseDate.setHours(0, 0, 0, 0));
        endDate = new Date(baseDate.setHours(23, 59, 59, 999));
        break;
      case 'week':
        const dayOfWeek = baseDate.getDay();
        const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(baseDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({ message: 'Geçersiz görünüm türü' });
    }
    
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id)
      .gte('start_date', startDate.toISOString())
      .lte('end_date', endDate.toISOString());
    
    if (user_id) {
      query = query.or(`created_by.eq.${user_id},assigned_to.cs.{${user_id}}`);
    }
    
    const { data: events, error } = await query.order('start_date', { ascending: true });
    if (error) return res.status(500).json({ message: 'Takvim görünümü getirilemedi' });
    
    res.json({
      view,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      events
    });
  } catch (error) {
    console.error('Get calendar view error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takvim istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { start_date, end_date } = req.query;
    
    let query = supabase
      .from('calendar_events')
      .select('type, priority, created_at')
      .eq('company_id', company_id);
    
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);
    
    const { data: events, error } = await query;
    if (error) return res.status(500).json({ message: 'Takvim istatistikleri getirilemedi' });
    
    const stats = {
      total: events?.length || 0,
      byType: {},
      byPriority: {},
      upcoming: events?.filter(e => new Date(e.start_date) > new Date()).length || 0,
      past: events?.filter(e => new Date(e.end_date) < new Date()).length || 0
    };
    
    events?.forEach(event => {
      // Tür bazında
      if (!stats.byType[event.type]) stats.byType[event.type] = 0;
      stats.byType[event.type]++;
      
      // Öncelik bazında
      if (!stats.byPriority[event.priority]) stats.byPriority[event.priority] = 0;
      stats.byPriority[event.priority]++;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Get calendar stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Toplantı hatırlatıcıları
router.get('/reminders', async (req, res) => {
  try {
    const { company_id } = req.user;
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    
    const { data: reminders, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        created_by_user:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id)
      .eq('type', 'meeting')
      .gte('start_date', now.toISOString())
      .lte('start_date', nextHour.toISOString())
      .order('start_date', { ascending: true });
    
    if (error) return res.status(500).json({ message: 'Hatırlatıcılar getirilemedi' });
    
    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 