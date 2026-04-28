const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger')('Projects');

const router = express.Router();

// Tüm projeleri getir
router.get('/', async (req, res) => {
  try {
    logger.debug('GET /api/projects çağırıldı', { query: req.query });

    const { status, priority, search } = req.query;

    logger.debug('Filtreler:', { status, priority, search });

    let query = supabaseAdmin
      .from('projects')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (search) {
      query = query.or(`name.ilike.% ${search}%, description.ilike.% ${search}% `);
    }

    logger.debug('Supabase query hazırlandı, çalıştırılıyor...');
    const { data: projects, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase hatası:', error);
      return res.status(500).json({ message: 'Projeler getirilemedi' });
    }

    logger.success('Projeler başarıyla getirildi', { count: projects ? projects.length : 0 });
    res.json(projects);
  } catch (error) {
    console.error('❌ Get projects error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Proje oluştur
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('budget').optional().isFloat({ min: 0 }),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']),
  body('status').isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  body('team_members').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Test için geçici olarak company_id'yi hardcode yapıyoruz
    const { company_id } = req.user;
    const { team_members, ...projectData } = req.body;

    // Proje oluştur
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert([{
        ...projectData,
        company_id,
        manager_id: req.user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Proje oluşturulamadı' });
    }

    // Ekip üyelerini ekle
    if (team_members && team_members.length > 0) {
      const teamData = team_members.map(memberId => ({
        project_id: project.id,
        user_id: memberId,
        role: 'member',
        joined_at: new Date().toISOString()
      }));

      await supabase
        .from('project_team_members')
        .insert(teamData);
    }

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message, details: error });
  }
});

// Proje detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
  *,
  company:companies(id, name),
  manager:users!manager_id(id, full_name, email),
  team_members: project_team_members(
    user_id,
    role,
    joined_at,
    users(id, full_name, email, avatar_url, role)
  ),
    tasks: project_tasks(
      id,
      title,
      description,
      status,
      priority,
      assigned_to,
      due_date,
      created_at
    ),
      budget_items(
        id,
        name,
        amount,
        type,
        status,
        created_at,
        vendor:vendors(id, name),
        customer:customers(id, name)
      )
        `)
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (error || !project) {
      return res.status(404).json({ message: 'Proje bulunamadı' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Proje güncelle
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('budget').optional().isFloat({ min: 0 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error || !project) {
      return res.status(404).json({ message: 'Proje bulunamadı' });
    }

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Proje sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);

    if (error) {
      return res.status(500).json({ message: 'Proje silinemedi' });
    }

    res.json({ message: 'Proje başarıyla silindi' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Proje istatistikleri
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;

    // Görev istatistikleri
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('status')
      .eq('project_id', id);

    const taskStats = {
      total: tasks?.length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0,
      inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
      pending: tasks?.filter(t => t.status === 'pending').length || 0,
      overdue: tasks?.filter(t => t.status === 'overdue').length || 0
    };

    // Bütçe istatistikleri
    const { data: budgetItems } = await supabase
      .from('budget_items')
      .select('amount, type')
      .eq('project_id', id);

    const budgetStats = {
      totalBudget: budgetItems?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0,
      totalExpense: budgetItems?.filter(item => item.type === 'expense').reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0,
      totalIncome: budgetItems?.filter(item => item.type === 'income').reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0
    };

    // Ekip üyesi sayısı
    const { count: teamCount } = await supabase
      .from('project_team_members')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    res.json({
      taskStats,
      budgetStats,
      teamCount: teamCount || 0,
      completionRate: taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ekip üyesi ekle
router.post('/:id/team', [
  body('user_id').notEmpty(),
  body('role').optional().isIn(['member', 'lead', 'manager'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;

    const { data: teamMember, error } = await supabase
      .from('project_team_members')
      .insert([{
        project_id: id,
        user_id,
        role,
        joined_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Ekip üyesi eklenemedi' });
    }

    res.status(201).json(teamMember);
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ekip üyesi çıkar
router.delete('/:id/team/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    const { error } = await supabase
      .from('project_team_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ message: 'Ekip üyesi çıkarılamadı' });
    }

    res.json({ message: 'Ekip üyesi başarıyla çıkarıldı' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;