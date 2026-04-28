const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece belirli dosya türleri yüklenebilir!'));
    }
  }
});

// Tüm dosyaları getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { related_type, related_id, file_type, search } = req.query;
    let query = supabase
      .from('file_attachments')
      .select('*')
      .eq('company_id', company_id);
    if (related_type) query = query.eq('related_type', related_type);
    if (related_id) query = query.eq('related_id', related_id);
    if (file_type) query = query.eq('file_type', file_type);
    if (search) query = query.or(`original_name.ilike.%${search}%,description.ilike.%${search}%`);
    const { data: files, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Dosyalar getirilemedi' });
    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dosya yükle
router.post('/upload', upload.single('file'), [
  body('related_type').optional(),
  body('related_id').optional(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi' });
    }

    const { company_id } = req.user;
    const { related_type, related_id, description } = req.body;
    
    const fileData = {
      original_name: req.file.originalname,
      file_name: req.file.filename,
      file_path: req.file.path,
      file_size: req.file.size,
      file_type: path.extname(req.file.originalname).toLowerCase(),
      mime_type: req.file.mimetype,
      related_type: related_type || null,
      related_id: related_id || null,
      description: description || null,
      company_id,
      uploaded_by: req.user.id,
      created_at: new Date().toISOString()
    };

    const { data: file, error } = await supabase
      .from('file_attachments')
      .insert([fileData])
      .select()
      .single();

    if (error) {
      // Dosyayı sil
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: 'Dosya kaydedilemedi' });
    }

    res.status(201).json(file);
  } catch (error) {
    console.error('Upload file error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dosya indir
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: file, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (error || !file) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ message: 'Dosya diskte bulunamadı' });
    }

    res.download(file.file_path, file.original_name);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dosya detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: file, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (error || !file) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    res.json(file);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dosya güncelle
router.put('/:id', [
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { company_id } = req.user;
    const { description } = req.body;
    
    const updateData = {
      description: description || null,
      updated_at: new Date().toISOString()
    };

    const { data: file, error } = await supabase
      .from('file_attachments')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error || !file) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    res.json(file);
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dosya sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    // Dosya bilgilerini al
    const { data: file, error: fetchError } = await supabase
      .from('file_attachments')
      .select('file_path')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    // Veritabanından sil
    const { error: deleteError } = await supabase
      .from('file_attachments')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);

    if (deleteError) {
      return res.status(500).json({ message: 'Dosya silinemedi' });
    }

    // Diskten dosyayı sil
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    res.json({ message: 'Dosya başarıyla silindi' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dosya istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { data: files, error } = await supabase
      .from('file_attachments')
      .select('file_size, file_type, created_at')
      .eq('company_id', company_id);
    
    if (error) return res.status(500).json({ message: 'Dosya istatistikleri getirilemedi' });
    
    const totalSize = files?.reduce((sum, file) => sum + parseInt(file.file_size), 0) || 0;
    const fileTypeCount = {};
    files?.forEach(file => {
      const type = file.file_type;
      fileTypeCount[type] = (fileTypeCount[type] || 0) + 1;
    });
    
    const stats = {
      totalFiles: files?.length || 0,
      totalSize: totalSize,
      averageSize: files?.length > 0 ? totalSize / files.length : 0,
      byType: fileTypeCount
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 