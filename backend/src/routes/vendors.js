const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm tedarikçileri getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { status, search } = req.query;
    let query = supabase
      .from('vendors')
      .select('*')
      .eq('company_id', company_id);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
    const { data: vendors, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Tedarikçiler getirilemedi' });
    res.json(vendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tedarikçi oluştur
router.post('/', [
  body('name').notEmpty().trim(),
  body('contact_person').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('status').isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { company_id } = req.user;
    const vendorData = req.body;
    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert([{ ...vendorData, company_id, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) return res.status(500).json({ message: 'Tedarikçi oluşturulamadı' });
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tedarikçi detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    if (error || !vendor) return res.status(404).json({ message: 'Tedarikçi bulunamadı' });
    res.json(vendor);
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tedarikçi güncelle
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('contact_person').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    if (error || !vendor) return res.status(404).json({ message: 'Tedarikçi bulunamadı' });
    res.json(vendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tedarikçi sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    if (error) return res.status(500).json({ message: 'Tedarikçi silinemedi' });
    res.json({ message: 'Tedarikçi başarıyla silindi' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tedarikçi istatistikleri
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    // İlgili tedarikçinin proje, bütçe kalemi sayısı
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', id)
      .eq('company_id', company_id);
    const { data: budgetItems } = await supabase
      .from('budget_items')
      .select('amount, type')
      .eq('vendor_id', id)
      .eq('company_id', company_id);
    const totalAmount = budgetItems?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const expenseAmount = budgetItems?.filter(item => item.type === 'expense').reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    res.json({
      projectCount: projectCount || 0,
      totalAmount,
      expenseAmount,
      itemCount: budgetItems?.length || 0
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 