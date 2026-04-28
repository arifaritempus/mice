const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');

const router = express.Router();

// Tüm kullanıcıları getir (Supabase Auth ve public.users tablosu birleştirilmiş)
router.get('/', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Sistem yöneticisi yetkisi yapılandırılmamış' });
    }

    // 1) Supabase Auth'taki tüm kullanıcıları çek
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('Auth users fetch error:', authError);
      return res.status(500).json({ message: 'Supabase Auth kullanıcıları getirilemedi', error: authError.message });
    }

    // 2) public.users tablosundaki ekstraları çek
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*');

    // 3) Birleştir ve Normalize et
    const publicUsersMap = new Map((publicUsers || []).map(u => [u.id, u]));
    
    const mergedUsers = authUsers.map(authUser => {
      const publicUser = publicUsersMap.get(authUser.id) || {};
      const meta = authUser.user_metadata || {};
      const firstName = publicUser.first_name || meta.first_name || '';
      const lastName = publicUser.last_name || meta.last_name || '';
      const fullName = publicUser.full_name || meta.full_name || `${firstName} ${lastName}`.trim();
      
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: publicUser.role || meta.role || 'user',
        is_active: publicUser.is_active ?? true,
        created_at: authUser.created_at,
        last_login: authUser.last_sign_in_at || publicUser.last_login,
        source: publicUser.id ? 'database' : 'auth_only'
      };
    });

    res.json(mergedUsers);
  } catch (error) {
    console.error('Get all users merge error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı oluştur
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'manager', 'employee', 'viewer']),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('phone').optional().trim(),
  body('avatar_url').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const userData = req.body;
    
    // Email kontrolü
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .eq('company_id', company_id)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        company_id,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Kullanıcı oluşturulamadı' });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        team_memberships(
          *,
          project:projects(name, status)
        ),
        assigned_tasks(
          *,
          project:projects(name)
        )
      `)
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı güncelle
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('role').optional().isIn(['admin', 'manager', 'employee', 'viewer']),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('phone').optional().trim(),
  body('avatar_url').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    
    if (error || !user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    // Kendini silmeye çalışıyorsa engelle
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Kendinizi silemezsiniz' });
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    
    if (error) return res.status(500).json({ message: 'Kullanıcı silinemedi' });
    
    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı profilini güncelle
router.put('/profile/update', [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().trim(),
  body('avatar_url').optional().trim(),
  body('bio').optional().trim(),
  body('timezone').optional().trim(),
  body('language').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .eq('company_id', company_id)
      .select()
      .single();
    
    if (error || !user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre değiştir
router.put('/profile/change-password', [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { current_password, new_password } = req.body;
    const { company_id } = req.user;
    
    // Mevcut şifre kontrolü (gerçek uygulamada hash kontrolü yapılır)
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Şifre güncelleme (gerçek uygulamada hash'leme yapılır)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);
    
    if (updateError) return res.status(500).json({ message: 'Şifre güncellenemedi' });
    
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı istatistikleri
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    // Kullanıcının görev istatistikleri
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('company_id', company_id)
      .eq('assigned_to', id);
    
    // Kullanıcının proje istatistikleri
    const { data: projects } = await supabase
      .from('team_members')
      .select(`
        project:projects(status)
      `)
      .eq('company_id', company_id)
      .eq('user_id', id);
    
    // Kullanıcının etkinlik istatistikleri
    const { data: events } = await supabase
      .from('calendar_events')
      .select('type')
      .eq('company_id', company_id)
      .or(`created_by.eq.${id},assigned_to.cs.{${id}}`);
    
    const stats = {
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
      pendingTasks: tasks?.filter(t => t.status === 'pending').length || 0,
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter(p => p.project?.status === 'active').length || 0,
      totalEvents: events?.length || 0,
      taskCompletionRate: tasks?.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Kullanıcı istatistikleri getirilemedi' });
  }
});

// Kullanıcı aktiviteleri
router.get('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { limit = 20 } = req.query;
    
    const { data: activities, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', company_id)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) return res.status(500).json({ message: 'Aktiviteler getirilemedi' });
    
    res.json(activities);
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takım üyelerini getir
router.get('/team/members', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { project_id, department } = req.query;
    
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar_url,
        role,
        department,
        position,
        status,
        last_login
      `)
      .eq('company_id', company_id)
      .eq('status', 'active');
    
    if (department) query = query.eq('department', department);
    
    const { data: users, error } = await query.order('name');
    
    if (error) return res.status(500).json({ message: 'Takım üyeleri getirilemedi' });
    
    // Eğer proje ID'si verilmişse, o projede çalışanları filtrele
    if (project_id) {
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('project_id', project_id)
        .eq('company_id', company_id);
      
      const projectUserIds = teamMembers?.map(tm => tm.user_id) || [];
      const filteredUsers = users.filter(user => projectUserIds.includes(user.id));
      
      return res.json(filteredUsers);
    }
    
    res.json(users);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı rollerini getir
router.get('/roles', async (req, res) => {
  try {
    const roles = [
      {
        id: 'admin',
        name: 'Yönetici',
        description: 'Tam sistem erişimi',
        permissions: ['all']
      },
      {
        id: 'manager',
        name: 'Müdür',
        description: 'Proje ve takım yönetimi',
        permissions: ['projects', 'tasks', 'team', 'reports']
      },
      {
        id: 'employee',
        name: 'Çalışan',
        description: 'Görev ve etkinlik yönetimi',
        permissions: ['tasks', 'events', 'calendar']
      },
      {
        id: 'viewer',
        name: 'Görüntüleyici',
        description: 'Sadece görüntüleme erişimi',
        permissions: ['view']
      }
    ];
    
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı izinlerini kontrol et
router.get('/permissions', async (req, res) => {
  try {
    const { company_id } = req.user;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    const permissions = {
      admin: ['all'],
      manager: ['projects', 'tasks', 'team', 'reports', 'events', 'calendar', 'budget'],
      employee: ['tasks', 'events', 'calendar', 'files'],
      viewer: ['view']
    };
    
    res.json({
      role: user.role,
      permissions: permissions[user.role] || []
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;