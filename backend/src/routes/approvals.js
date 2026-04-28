const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm onay taleplerini getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { status, type, requester_id, approver_id } = req.query;
    let query = supabase
      .from('approvals')
      .select(`
        *,
        requester:users(name, email),
        approver:users(name, email),
        related_item:events(name)
      `)
      .eq('company_id', company_id);
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (requester_id) query = query.eq('requester_id', requester_id);
    if (approver_id) query = query.eq('approver_id', approver_id);
    const { data: approvals, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Onay talepleri getirilemedi' });
    res.json(approvals);
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay talebi oluştur
router.post('/', [
  body('type').isIn(['budget', 'project', 'expense', 'purchase', 'leave', 'other']),
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('related_type').optional(),
  body('related_id').optional(),
  body('approver_id').notEmpty(),
  body('priority').isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const approvalData = req.body;
    
    const { data: approval, error } = await supabase
      .from('approvals')
      .insert([{
        ...approvalData,
        company_id,
        requester_id: req.user.id,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Onay talebi oluşturulamadı' });
    
    res.status(201).json(approval);
  } catch (error) {
    console.error('Create approval error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay talebi detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: approval, error } = await supabase
      .from('approvals')
      .select(`
        *,
        requester:users(name, email, avatar_url),
        approver:users(name, email, avatar_url)
      `)
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !approval) {
      return res.status(404).json({ message: 'Onay talebi bulunamadı' });
    }
    
    res.json(approval);
  } catch (error) {
    console.error('Get approval error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay talebini güncelle
router.put('/:id', [
  body('title').optional().notEmpty().trim(),
  body('description').optional().notEmpty().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    
    const { data: approval, error } = await supabase
      .from('approvals')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('requester_id', req.user.id)
      .select()
      .single();
    
    if (error || !approval) {
      return res.status(404).json({ message: 'Onay talebi bulunamadı' });
    }
    
    res.json(approval);
  } catch (error) {
    console.error('Update approval error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay talebini onayla/reddet
router.patch('/:id/respond', [
  body('status').isIn(['approved', 'rejected']),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { company_id } = req.user;
    const { status, comment } = req.body;
    
    // Onay yetkisi kontrolü
    const { data: approval, error: fetchError } = await supabase
      .from('approvals')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('approver_id', req.user.id)
      .eq('status', 'pending')
      .single();
    
    if (fetchError || !approval) {
      return res.status(404).json({ message: 'Onay talebi bulunamadı veya onay yetkiniz yok' });
    }
    
    const updateData = {
      status,
      approver_comment: comment || null,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      rejected_at: status === 'rejected' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedApproval, error } = await supabase
      .from('approvals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Onay durumu güncellenemedi' });
    
    res.json(updatedApproval);
  } catch (error) {
    console.error('Respond to approval error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay talebini iptal et
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: approval, error } = await supabase
      .from('approvals')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('requester_id', req.user.id)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (error || !approval) {
      return res.status(404).json({ message: 'Onay talebi bulunamadı veya iptal edilemez' });
    }
    
    res.json(approval);
  } catch (error) {
    console.error('Cancel approval error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay talebini sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { error } = await supabase
      .from('approvals')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id)
      .eq('requester_id', req.user.id)
      .eq('status', 'pending');
    
    if (error) return res.status(500).json({ message: 'Onay talebi silinemedi' });
    
    res.json({ message: 'Onay talebi başarıyla silindi' });
  } catch (error) {
    console.error('Delete approval error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bekleyen onaylarımı getir
router.get('/pending/my-approvals', async (req, res) => {
  try {
    const { company_id } = req.user;
    
    const { data: approvals, error } = await supabase
      .from('approvals')
      .select(`
        *,
        requester:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id)
      .eq('approver_id', req.user.id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (error) return res.status(500).json({ message: 'Bekleyen onaylar getirilemedi' });
    
    res.json(approvals);
  } catch (error) {
    console.error('Get my pending approvals error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay geçmişimi getir
router.get('/history/my-approvals', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { status, type } = req.query;
    
    let query = supabase
      .from('approvals')
      .select(`
        *,
        requester:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id)
      .eq('approver_id', req.user.id)
      .neq('status', 'pending');
    
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    
    const { data: approvals, error } = await query.order('updated_at', { ascending: false });
    
    if (error) return res.status(500).json({ message: 'Onay geçmişi getirilemedi' });
    
    res.json(approvals);
  } catch (error) {
    console.error('Get my approval history error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Onay istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { data: approvals, error } = await supabase
      .from('approvals')
      .select('status, type, created_at')
      .eq('company_id', company_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) return res.status(500).json({ message: 'Onay istatistikleri getirilemedi' });
    
    const stats = {
      total: approvals?.length || 0,
      pending: approvals?.filter(a => a.status === 'pending').length || 0,
      approved: approvals?.filter(a => a.status === 'approved').length || 0,
      rejected: approvals?.filter(a => a.status === 'rejected').length || 0,
      cancelled: approvals?.filter(a => a.status === 'cancelled').length || 0,
      byType: {}
    };
    
    approvals?.forEach(approval => {
      if (!stats.byType[approval.type]) {
        stats.byType[approval.type] = { total: 0, pending: 0, approved: 0, rejected: 0 };
      }
      stats.byType[approval.type].total++;
      stats.byType[approval.type][approval.status]++;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Get approval stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 