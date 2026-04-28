const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm bildirimleri getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { type, is_read, limit = 50 } = req.query;
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('company_id', company_id)
      .eq('user_id', req.user.id);
    if (type) query = query.eq('type', type);
    if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');
    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    if (error) return res.status(500).json({ message: 'Bildirimler getirilemedi' });
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim oluştur
router.post('/', [
  body('title').notEmpty().trim(),
  body('message').notEmpty().trim(),
  body('type').isIn(['info', 'warning', 'error', 'success']),
  body('user_id').optional(),
  body('related_type').optional(),
  body('related_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { company_id } = req.user;
    const notificationData = req.body;
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{ ...notificationData, company_id, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) return res.status(500).json({ message: 'Bildirim oluşturulamadı' });
    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('user_id', req.user.id)
      .single();
    if (error || !notification) return res.status(404).json({ message: 'Bildirim bulunamadı' });
    res.json(notification);
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim güncelle
router.put('/:id', [
  body('title').optional().notEmpty().trim(),
  body('message').optional().notEmpty().trim(),
  body('type').optional().isIn(['info', 'warning', 'error', 'success']),
  body('is_read').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error || !notification) return res.status(404).json({ message: 'Bildirim bulunamadı' });
    res.json(notification);
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('user_id', req.user.id);
    if (error) return res.status(500).json({ message: 'Bildirim silinemedi' });
    res.json({ message: 'Bildirim başarıyla silindi' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirimi okundu olarak işaretle
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error || !notification) return res.status(404).json({ message: 'Bildirim bulunamadı' });
    res.json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm bildirimleri okundu olarak işaretle
router.patch('/read-all', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('company_id', company_id)
      .eq('user_id', req.user.id)
      .eq('is_read', false);
    if (error) return res.status(500).json({ message: 'Bildirimler güncellenemedi' });
    res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Okunmamış bildirim sayısı
router.get('/unread/count', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('user_id', req.user.id)
      .eq('is_read', false);
    if (error) return res.status(500).json({ message: 'Bildirim sayısı getirilemedi' });
    res.json({ unreadCount: count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('type, is_read, created_at')
      .eq('company_id', company_id)
      .eq('user_id', req.user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (error) return res.status(500).json({ message: 'Bildirim istatistikleri getirilemedi' });
    const stats = {
      total: notifications?.length || 0,
      unread: notifications?.filter(n => !n.is_read).length || 0,
      read: notifications?.filter(n => n.is_read).length || 0,
      byType: {
        info: notifications?.filter(n => n.type === 'info').length || 0,
        warning: notifications?.filter(n => n.type === 'warning').length || 0,
        error: notifications?.filter(n => n.type === 'error').length || 0,
        success: notifications?.filter(n => n.type === 'success').length || 0
      }
    };
    res.json(stats);
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 