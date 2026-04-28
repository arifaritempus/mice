const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm müşterileri getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { status, search } = req.query;
    let query = supabase
      .from('customers')
      .select('*')
      .eq('company_id', company_id);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data: customers, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Müşteriler getirilemedi' });
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Müşteri oluştur
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('status').isIn(['active', 'inactive', 'prospect', 'lost'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { company_id } = req.user;
    const customerData = req.body;
    const { data: customer, error } = await supabase
      .from('customers')
      .insert([{ ...customerData, company_id, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) return res.status(500).json({ message: 'Müşteri oluşturulamadı' });
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Müşteri detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    if (error || !customer) return res.status(404).json({ message: 'Müşteri bulunamadı' });
    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Müşteri güncelle
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'prospect', 'lost'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    const { data: customer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    if (error || !customer) return res.status(404).json({ message: 'Müşteri bulunamadı' });
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Müşteri sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    if (error) return res.status(500).json({ message: 'Müşteri silinemedi' });
    res.json({ message: 'Müşteri başarıyla silindi' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Müşteri istatistikleri
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    // İlgili müşterinin etkinlik, proje, finansal işlem sayısı
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id)
      .eq('company_id', company_id);
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id)
      .eq('company_id', company_id);
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('amount, type')
      .eq('customer_id', id)
      .eq('company_id', company_id);
    const totalRevenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    res.json({
      eventCount: eventCount || 0,
      projectCount: projectCount || 0,
      totalRevenue,
      totalExpense,
      balance: totalRevenue - totalExpense
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 