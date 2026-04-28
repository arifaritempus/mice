const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Proje otel ekstralarını getir
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const { data, error } = await supabase
      .from('project_hotel_extras')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Otel ekstralar getirilirken hata:', error);
      return res.status(500).json({ message: 'Otel ekstralar getirilemedi' });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Get hotel extras error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Otel ekstra oluştur
router.post('/', [
  body('project_id').isUUID(),
  body('date').isISO8601(),
  body('hotel').notEmpty().trim(),
  body('main_category').notEmpty().trim(),
  body('amount').isFloat({ min: 0 }),
  body('currency').notEmpty().trim(),
  body('total_try').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { data, error } = await supabase
      .from('project_hotel_extras')
      .insert([{
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Otel ekstra oluşturulurken hata:', error);
      return res.status(500).json({ message: 'Otel ekstra oluşturulamadı' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create hotel extra error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Otel ekstra güncelle
router.put('/:id', [
  body('project_id').optional().isUUID(),
  body('date').optional().isISO8601(),
  body('hotel').optional().trim(),
  body('main_category').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('currency').optional().trim(),
  body('total_try').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('project_hotel_extras')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Otel ekstra güncellenirken hata:', error);
      return res.status(500).json({ message: 'Otel ekstra güncellenemedi' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Otel ekstra bulunamadı' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update hotel extra error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Otel ekstra sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('project_hotel_extras')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Otel ekstra silinirken hata:', error);
      return res.status(500).json({ message: 'Otel ekstra silinemedi' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete hotel extra error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
