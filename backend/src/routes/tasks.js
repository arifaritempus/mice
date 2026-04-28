const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm görevleri getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { project_id, status, priority, assigned_to, search } = req.query;

    let query = supabase
      .from('project_tasks')
      .select(`
        *,
        project:projects(name),
        assigned_user:users(name, email, avatar_url),
        created_by_user:users(name)
      `)
      .eq('projects.company_id', company_id);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: tasks, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Görevler getirilemedi' });
    }

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev oluştur
router.post('/', [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('project_id').notEmpty(),
  body('assigned_to').optional(),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']),
  body('status').isIn(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']),
  body('due_date').optional().isISO8601(),
  body('estimated_hours').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company_id } = req.user;
    const taskData = req.body;

    // Projenin şirkete ait olduğunu kontrol et
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', taskData.project_id)
      .eq('company_id', company_id)
      .single();

    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı' });
    }

    const { data: task, error } = await supabase
      .from('project_tasks')
      .insert([{
        ...taskData,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Görev oluşturulamadı' });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;

    const { data: task, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        project:projects(
          id,
          name,
          description,
          status
        ),
        assigned_user:users(
          id,
          name,
          email,
          avatar_url
        ),
        created_by_user:users(
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .eq('projects.company_id', company_id)
      .single();

    if (error || !task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev güncelle
router.put('/:id', [
  body('title').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('assigned_to').optional(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']),
  body('due_date').optional().isISO8601(),
  body('estimated_hours').optional().isFloat({ min: 0 }),
  body('actual_hours').optional().isFloat({ min: 0 })
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

    // Görevin şirkete ait olduğunu kontrol et
    const { data: existingTask } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', id)
      .eq('projects.company_id', company_id)
      .single();

    if (!existingTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    const { data: task, error } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Görev güncellenemedi' });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;

    // Görevin şirkete ait olduğunu kontrol et
    const { data: existingTask } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', id)
      .eq('projects.company_id', company_id)
      .single();

    if (!existingTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Görev silinemedi' });
    }

    res.json({ message: 'Görev başarıyla silindi' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev durumunu güncelle
router.patch('/:id/status', [
  body('status').isIn(['pending', 'in_progress', 'completed', 'overdue', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const { company_id } = req.user;

    // Görevin şirkete ait olduğunu kontrol et
    const { data: existingTask } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', id)
      .eq('projects.company_id', company_id)
      .single();

    if (!existingTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    const { data: task, error } = await supabase
      .from('project_tasks')
      .update({
        status,
        updated_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Görev durumu güncellenemedi' });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev atama
router.patch('/:id/assign', [
  body('assigned_to').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { assigned_to } = req.body;
    const { company_id } = req.user;

    // Görevin şirkete ait olduğunu kontrol et
    const { data: existingTask } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', id)
      .eq('projects.company_id', company_id)
      .single();

    if (!existingTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Kullanıcının şirkete ait olduğunu kontrol et
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', assigned_to)
      .eq('company_id', company_id)
      .single();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const { data: task, error } = await supabase
      .from('project_tasks')
      .update({
        assigned_to,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Görev atanamadı' });
    }

    res.json(task);
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev yorumu ekle
router.post('/:id/comments', [
  body('comment').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { comment } = req.body;
    const { company_id } = req.user;

    // Görevin şirkete ait olduğunu kontrol et
    const { data: existingTask } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', id)
      .eq('projects.company_id', company_id)
      .single();

    if (!existingTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    const { data: taskComment, error } = await supabase
      .from('task_comments')
      .insert([{
        task_id: id,
        user_id: req.user.id,
        comment,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .single();

    if (error) {
      return res.status(500).json({ message: 'Yorum eklenemedi' });
    }

    res.status(201).json(taskComment);
  } catch (error) {
    console.error('Add task comment error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Görev yorumlarını getir
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;

    // Görevin şirkete ait olduğunu kontrol et
    const { data: existingTask } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('id', id)
      .eq('projects.company_id', company_id)
      .single();

    if (!existingTask) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ message: 'Yorumlar getirilemedi' });
    }

    res.json(comments);
  } catch (error) {
    console.error('Get task comments error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 