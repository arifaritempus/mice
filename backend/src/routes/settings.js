const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../config/database');

const router = express.Router();

// Multer konfigürasyonu (memory storage - dosyayı bellekte tut)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

// Service role key ile Supabase client oluştur (RLS bypass için)
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔍 Supabase Admin Client oluşturuluyor...');
  console.log('🔍 SUPABASE_URL:', supabaseUrl);
  console.log('🔍 SUPABASE_SERVICE_ROLE_KEY var mı?', !!supabaseServiceKey);
  
  if (!supabaseServiceKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY bulunamadı. RLS bypass çalışmayabilir.');
    return supabase; // Fallback to regular supabase
  }
  
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL bulunamadı!');
    throw new Error('SUPABASE_URL environment değişkeni gerekli');
  }
  
  // Service Role Key ile admin client oluştur
  // NOT: Service Role Key RLS'yi bypass eder
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    }
  });
  
  console.log('✅ Supabase Admin Client oluşturuldu');
  return adminClient;
};

// Şirket ayarlarını getir
router.get('/company', async (req, res) => {
  try {
    const { company_id } = req.user;
    
    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', company_id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ message: 'Şirket ayarları getirilemedi' });
    }
    
    // Varsayılan ayarlar
    const defaultSettings = {
      company_id,
      timezone: 'Europe/Istanbul',
      language: 'tr',
      currency: 'TRY',
      date_format: 'DD/MM/YYYY',
      time_format: '24',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      features: {
        calendar: true,
        reports: true,
        approvals: true,
        goals: true
      },
      branding: {
        logo_url: null,
        primary_color: '#3B82F6',
        secondary_color: '#1F2937'
      }
    };
    
    res.json(settings || defaultSettings);
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şirket ayarlarını güncelle
router.put('/company', [
  body('timezone').optional().trim(),
  body('language').optional().isIn(['tr', 'en']),
  body('currency').optional().trim(),
  body('date_format').optional().trim(),
  body('time_format').optional().isIn(['12', '24']),
  body('notifications').optional().isObject(),
  body('features').optional().isObject(),
  body('branding').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    
    // Mevcut ayarları kontrol et
    const { data: existingSettings } = await supabase
      .from('company_settings')
      .select('id')
      .eq('company_id', company_id)
      .single();
    
    let result;
    if (existingSettings) {
      // Güncelle
      const { data: settings, error } = await supabase
        .from('company_settings')
        .update(updateData)
        .eq('company_id', company_id)
        .select()
        .single();
      
      if (error) return res.status(500).json({ message: 'Ayarlar güncellenemedi' });
      result = settings;
    } else {
      // Yeni oluştur
      const { data: settings, error } = await supabase
        .from('company_settings')
        .insert([{
          ...updateData,
          company_id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) return res.status(500).json({ message: 'Ayarlar oluşturulamadı' });
      result = settings;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı ayarlarını getir
router.get('/user', async (req, res) => {
  try {
    const { company_id } = req.user;
    const userId = req.user.id;
    
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('company_id', company_id)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ message: 'Kullanıcı ayarları getirilemedi' });
    }
    
    // Varsayılan ayarlar
    const defaultSettings = {
      company_id,
      user_id: userId,
      theme: 'light',
      language: 'tr',
      timezone: 'Europe/Istanbul',
      notifications: {
        email: true,
        push: true,
        sms: false,
        desktop: true
      },
      dashboard: {
        layout: 'default',
        widgets: ['overview', 'tasks', 'events', 'recent_activities']
      },
      calendar: {
        view: 'month',
        working_hours: {
          start: '09:00',
          end: '18:00'
        },
        show_weekends: true
      }
    };
    
    res.json(settings || defaultSettings);
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı ayarlarını güncelle
router.put('/user', [
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('language').optional().isIn(['tr', 'en']),
  body('timezone').optional().trim(),
  body('notifications').optional().isObject(),
  body('dashboard').optional().isObject(),
  body('calendar').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const userId = req.user.id;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    
    // Mevcut ayarları kontrol et
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('company_id', company_id)
      .eq('user_id', userId)
      .single();
    
    let result;
    if (existingSettings) {
      // Güncelle
      const { data: settings, error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('company_id', company_id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) return res.status(500).json({ message: 'Ayarlar güncellenemedi' });
      result = settings;
    } else {
      // Yeni oluştur
      const { data: settings, error } = await supabase
        .from('user_settings')
        .insert([{
          ...updateData,
          company_id,
          user_id: userId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) return res.status(500).json({ message: 'Ayarlar oluşturulamadı' });
      result = settings;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Sistem konfigürasyonunu getir
router.get('/system', async (req, res) => {
  try {
    const config = {
      version: '1.0.0',
      features: {
        calendar: true,
        projects: true,
        tasks: true,
        events: true,
        budget: true,
        reports: true,
        approvals: true,
        goals: true,
        notifications: true,
        file_upload: true
      },
      limits: {
        max_file_size: 10 * 1024 * 1024, // 10MB
        max_files_per_upload: 5,
        max_users_per_company: 100,
        max_projects_per_company: 1000,
        max_events_per_company: 500
      },
      integrations: {
        email: true,
        sms: false,
        payment: false,
        calendar_sync: false
      },
      security: {
        password_min_length: 8,
        require_2fa: false,
        session_timeout: 24 * 60 * 60, // 24 saat
        max_login_attempts: 5
      }
    };
    
    res.json(config);
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim ayarlarını güncelle
router.put('/notifications', [
  body('email').optional().isBoolean(),
  body('push').optional().isBoolean(),
  body('sms').optional().isBoolean(),
  body('desktop').optional().isBoolean(),
  body('types').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const userId = req.user.id;
    const notificationSettings = req.body;
    
    // Kullanıcı ayarlarını güncelle
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('notifications')
      .eq('company_id', company_id)
      .eq('user_id', userId)
      .single();
    
    const currentNotifications = existingSettings?.notifications || {};
    const updatedNotifications = { ...currentNotifications, ...notificationSettings };
    
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        company_id,
        user_id: userId,
        notifications: updatedNotifications,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Bildirim ayarları güncellenemedi' });
    
    res.json(settings);
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dashboard widget ayarlarını güncelle
router.put('/dashboard', [
  body('layout').optional().isIn(['default', 'compact', 'detailed']),
  body('widgets').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const userId = req.user.id;
    const dashboardSettings = req.body;
    
    // Kullanıcı ayarlarını güncelle
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('dashboard')
      .eq('company_id', company_id)
      .eq('user_id', userId)
      .single();
    
    const currentDashboard = existingSettings?.dashboard || {};
    const updatedDashboard = { ...currentDashboard, ...dashboardSettings };
    
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        company_id,
        user_id: userId,
        dashboard: updatedDashboard,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Dashboard ayarları güncellenemedi' });
    
    res.json(settings);
  } catch (error) {
    console.error('Update dashboard settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tema ayarlarını güncelle
router.put('/theme', [
  body('theme').isIn(['light', 'dark', 'auto'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const userId = req.user.id;
    const { theme } = req.body;
    
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        company_id,
        user_id: userId,
        theme,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Tema ayarı güncellenemedi' });
    
    res.json(settings);
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dil ayarlarını güncelle
router.put('/language', [
  body('language').isIn(['tr', 'en'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const userId = req.user.id;
    const { language } = req.body;
    
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        company_id,
        user_id: userId,
        language,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Dil ayarı güncellenemedi' });
    
    res.json(settings);
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Zaman dilimi ayarlarını güncelle
router.put('/timezone', [
  body('timezone').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const userId = req.user.id;
    const { timezone } = req.body;
    
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        company_id,
        user_id: userId,
        timezone,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Zaman dilimi ayarı güncellenemedi' });
    
    res.json(settings);
  } catch (error) {
    console.error('Update timezone error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ayarları sıfırla
router.post('/reset', async (req, res) => {
  try {
    const { company_id } = req.user;
    const userId = req.user.id;
    
    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('company_id', company_id)
      .eq('user_id', userId);
    
    if (error) return res.status(500).json({ message: 'Ayarlar sıfırlanamadı' });
    
    res.json({ message: 'Ayarlar başarıyla sıfırlandı' });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Desteklenen zaman dilimlerini getir
router.get('/timezones', async (req, res) => {
  try {
    const timezones = [
      { value: 'Europe/Istanbul', label: 'İstanbul (UTC+3)' },
      { value: 'Europe/London', label: 'Londra (UTC+0)' },
      { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
      { value: 'America/New_York', label: 'New York (UTC-5)' },
      { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
      { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
      { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
      { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' }
    ];
    
    res.json(timezones);
  } catch (error) {
    console.error('Get timezones error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Desteklenen dilleri getir
router.get('/languages', async (req, res) => {
  try {
    const languages = [
      { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
      { value: 'en', label: 'English', flag: '🇺🇸' }
    ];
    
    res.json(languages);
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Logo yükleme endpoint'i (Service role key ile RLS bypass)
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    console.log('📤 Logo yükleme isteği alındı');
    console.log('📤 Request body:', req.body);
    console.log('📤 Request file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer?.length
    } : 'No file');
    
    if (!req.file) {
      console.error('❌ Dosya yüklenmedi');
      return res.status(400).json({ message: 'Dosya yüklenmedi' });
    }

    const { field } = req.body; // 'dark_icon_logo', 'light_wordmark_logo', vb.
    
    if (!field) {
      console.error('❌ Logo field belirtilmedi');
      return res.status(400).json({ message: 'Logo field belirtilmedi' });
    }

    // Dosya adını oluştur - aynı field için aynı dosya adını kullan (eski dosya üzerine yazılacak)
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${field}.${fileExt}`; // Timestamp kaldırıldı - aynı field için aynı dosya adı
    console.log('📤 Dosya adı:', fileName);

    // Service role key ile Supabase client kullan (RLS bypass)
    const supabaseAdmin = getSupabaseAdmin();
    console.log('📤 Supabase admin client oluşturuldu');

    // Supabase Storage'a yükle
    console.log('📤 Supabase Storage\'a yükleniyor...');
    console.log('📤 Bucket: logos');
    console.log('📤 File name:', fileName);
    console.log('📤 File size:', req.file.buffer.length);
    console.log('📤 Content type:', req.file.mimetype);
    
    // Önce bucket'ın var olup olmadığını kontrol et
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Bucket listesi alınamadı:', bucketsError);
    } else {
      console.log('📤 Mevcut bucket\'lar:', buckets?.map(b => b.name));
      const logosBucket = buckets?.find(b => b.name === 'logos');
      if (!logosBucket) {
        console.error('❌ logos bucket bulunamadı!');
        return res.status(500).json({ 
          message: 'logos bucket bulunamadı. Lütfen Supabase Dashboard\'dan bucket\'ı oluşturun.' 
        });
      }
      console.log('✅ logos bucket bulundu:', logosBucket);
    }
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Supabase Storage yükleme hatası:', uploadError);
      console.error('❌ Hata detayları:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error
      });
      return res.status(500).json({ 
        message: 'Logo yüklenemedi', 
        error: uploadError.message,
        details: uploadError
      });
    }

    console.log('✅ Dosya başarıyla yüklendi:', uploadData);

    // Public URL'i al
    const { data: urlData } = supabaseAdmin.storage
      .from('logos')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      console.error('❌ Logo URL\'i alınamadı');
      return res.status(500).json({ message: 'Logo URL\'i alınamadı' });
    }

    console.log('✅ Logo URL:', urlData.publicUrl);

    res.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('❌ Upload logo error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Logo silme endpoint'i
router.delete('/delete-logo', async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ message: 'Dosya adı belirtilmedi' });
    }

    // Service role key ile Supabase client kullan
    const supabaseAdmin = getSupabaseAdmin();

    // Dosyayı sil
    const { error: deleteError } = await supabaseAdmin.storage
      .from('logos')
      .remove([fileName]);

    if (deleteError) {
      console.error('Logo silme hatası:', deleteError);
      return res.status(500).json({ 
        message: 'Logo silinemedi', 
        error: deleteError.message 
      });
    }

    res.json({ success: true, message: 'Logo başarıyla silindi' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router; 