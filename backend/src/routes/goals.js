const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm hedefleri getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { status, type, assigned_to, period } = req.query;
    
    let query = supabase
      .from('goals')
      .select(`
        *,
        assigned_to_user:users(name, email, avatar_url),
        created_by_user:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id);
    
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (period) query = query.eq('period', period);
    
    const { data: goals, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Hedefler getirilemedi' });
    
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Hedef oluştur
router.post('/', [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('type').isIn(['sales', 'revenue', 'events', 'projects', 'customers', 'tasks', 'other']),
  body('target_value').isFloat({ min: 0 }),
  body('current_value').optional().isFloat({ min: 0 }),
  body('unit').notEmpty().trim(),
  body('period').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('assigned_to').optional(),
  body('priority').isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const goalData = req.body;
    
    const { data: goal, error } = await supabase
      .from('goals')
      .insert([{
        ...goalData,
        company_id,
        created_by: req.user.id,
        current_value: goalData.current_value || 0,
        progress: goalData.current_value ? (goalData.current_value / goalData.target_value) * 100 : 0,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Hedef oluşturulamadı' });
    
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Hedef detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: goal, error } = await supabase
      .from('goals')
      .select(`
        *,
        assigned_to_user:users(name, email, avatar_url),
        created_by_user:users(name, email, avatar_url),
        progress_updates(
          *,
          updated_by_user:users(name, email)
        )
      `)
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !goal) {
      return res.status(404).json({ message: 'Hedef bulunamadı' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Hedef güncelle
router.put('/:id', [
  body('title').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('target_value').optional().isFloat({ min: 0 }),
  body('current_value').optional().isFloat({ min: 0 }),
  body('unit').optional().notEmpty().trim(),
  body('end_date').optional().isISO8601(),
  body('assigned_to').optional(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['active', 'completed', 'cancelled', 'on_hold'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    
    // İlerleme hesaplama
    if (updateData.current_value !== undefined && updateData.target_value !== undefined) {
      updateData.progress = (updateData.current_value / updateData.target_value) * 100;
    } else if (updateData.current_value !== undefined) {
      // Mevcut hedef değerini al
      const { data: currentGoal } = await supabase
        .from('goals')
        .select('target_value')
        .eq('id', id)
        .eq('company_id', company_id)
        .single();
      
      if (currentGoal) {
        updateData.progress = (updateData.current_value / currentGoal.target_value) * 100;
      }
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { data: goal, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    
    if (error || !goal) {
      return res.status(404).json({ message: 'Hedef bulunamadı' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Hedef sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    
    if (error) return res.status(500).json({ message: 'Hedef silinemedi' });
    
    res.json({ message: 'Hedef başarıyla silindi' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İlerleme güncellemesi ekle
router.post('/:id/progress', [
  body('current_value').isFloat({ min: 0 }),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id: goal_id } = req.params;
    const { company_id } = req.user;
    const { current_value, notes } = req.body;
    
    // Hedef bilgilerini al
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('target_value')
      .eq('id', goal_id)
      .eq('company_id', company_id)
      .single();
    
    if (goalError || !goal) {
      return res.status(404).json({ message: 'Hedef bulunamadı' });
    }
    
    const progress = (current_value / goal.target_value) * 100;
    
    // İlerleme güncellemesi oluştur
    const { data: progressUpdate, error: progressError } = await supabase
      .from('goal_progress_updates')
      .insert([{
        goal_id,
        company_id,
        current_value,
        progress,
        notes,
        updated_by: req.user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (progressError) return res.status(500).json({ message: 'İlerleme güncellemesi oluşturulamadı' });
    
    // Hedefi güncelle
    await supabase
      .from('goals')
      .update({
        current_value,
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', goal_id);
    
    res.status(201).json(progressUpdate);
  } catch (error) {
    console.error('Add progress update error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İlerleme geçmişini getir
router.get('/:id/progress', async (req, res) => {
  try {
    const { id: goal_id } = req.params;
    const { company_id } = req.user;
    const { limit = 20 } = req.query;
    
    const { data: progressUpdates, error } = await supabase
      .from('goal_progress_updates')
      .select(`
        *,
        updated_by_user:users(name, email, avatar_url)
      `)
      .eq('goal_id', goal_id)
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) return res.status(500).json({ message: 'İlerleme geçmişi getirilemedi' });
    
    res.json(progressUpdates);
  } catch (error) {
    console.error('Get progress history error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının hedeflerini getir
router.get('/my-goals', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { status, type } = req.query;
    
    let query = supabase
      .from('goals')
      .select(`
        *,
        created_by_user:users(name, email, avatar_url)
      `)
      .eq('company_id', company_id)
      .or(`assigned_to.eq.${req.user.id},created_by.eq.${req.user.id}`);
    
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    
    const { data: goals, error } = await query.order('end_date', { ascending: true });
    if (error) return res.status(500).json({ message: 'Kişisel hedefler getirilemedi' });
    
    res.json(goals);
  } catch (error) {
    console.error('Get my goals error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Hedef istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { period, type } = req.query;
    
    let query = supabase
      .from('goals')
      .select('status, type, progress, target_value, current_value')
      .eq('company_id', company_id);
    
    if (period) query = query.eq('period', period);
    if (type) query = query.eq('type', type);
    
    const { data: goals, error } = await query;
    if (error) return res.status(500).json({ message: 'Hedef istatistikleri getirilemedi' });
    
    const stats = {
      total: goals?.length || 0,
      active: goals?.filter(g => g.status === 'active').length || 0,
      completed: goals?.filter(g => g.status === 'completed').length || 0,
      cancelled: goals?.filter(g => g.status === 'cancelled').length || 0,
      averageProgress: goals?.length > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0,
      byType: {},
      byStatus: {}
    };
    
    goals?.forEach(goal => {
      // Tür bazında
      if (!stats.byType[goal.type]) stats.byType[goal.type] = { total: 0, completed: 0, averageProgress: 0 };
      stats.byType[goal.type].total++;
      if (goal.status === 'completed') stats.byType[goal.type].completed++;
      stats.byType[goal.type].averageProgress += goal.progress;
      
      // Durum bazında
      if (!stats.byStatus[goal.status]) stats.byStatus[goal.status] = 0;
      stats.byStatus[goal.status]++;
    });
    
    // Ortalama ilerleme hesapla
    Object.keys(stats.byType).forEach(type => {
      if (stats.byType[type].total > 0) {
        stats.byType[type].averageProgress = stats.byType[type].averageProgress / stats.byType[type].total;
      }
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Get goal stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// KPI hedefleri
router.get('/kpi', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { period = 'monthly' } = req.query;
    
    const { data: kpiGoals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('company_id', company_id)
      .eq('period', period)
      .eq('status', 'active')
      .order('priority', { ascending: false });
    
    if (error) return res.status(500).json({ message: 'KPI hedefleri getirilemedi' });
    
    res.json(kpiGoals);
  } catch (error) {
    console.error('Get KPI goals error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Hedef şablonları
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'sales_target',
        title: 'Satış Hedefi',
        type: 'sales',
        unit: 'adet',
        description: 'Aylık satış hedefi',
        default_period: 'monthly'
      },
      {
        id: 'revenue_target',
        title: 'Gelir Hedefi',
        type: 'revenue',
        unit: 'TL',
        description: 'Aylık gelir hedefi',
        default_period: 'monthly'
      },
      {
        id: 'event_target',
        title: 'Etkinlik Hedefi',
        type: 'events',
        unit: 'etkinlik',
        description: 'Aylık etkinlik sayısı hedefi',
        default_period: 'monthly'
      },
      {
        id: 'customer_target',
        title: 'Müşteri Hedefi',
        type: 'customers',
        unit: 'müşteri',
        description: 'Yeni müşteri kazanma hedefi',
        default_period: 'monthly'
      },
      {
        id: 'project_target',
        title: 'Proje Hedefi',
        type: 'projects',
        unit: 'proje',
        description: 'Tamamlanan proje sayısı hedefi',
        default_period: 'monthly'
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error('Get goal templates error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 