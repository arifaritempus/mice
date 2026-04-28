const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm bütçe kalemlerini getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { project_id, type, category, status, search } = req.query;

    let query = supabase
      .from('budget_items')
      .select(`
        *,
        project:projects(name),
        vendor:vendors(name, contact_person),
        created_by_user:users(name)
      `)
      .eq('company_id', company_id);

    if (project_id) query = query.eq('project_id', project_id);
    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: budgetItems, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Bütçe kalemleri getirilemedi' });
    res.json(budgetItems);
  } catch (error) {
    console.error('Get budget items error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bütçe kalemi oluştur
router.post('/', [
  body('name').notEmpty().trim(),
  body('amount').isFloat({ min: 0 }),
  body('type').isIn(['income', 'expense']),
  body('category').notEmpty().trim(),
  body('status').isIn(['pending', 'approved', 'rejected', 'paid', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { company_id } = req.user;
    const budgetData = req.body;
    const { data: budgetItem, error } = await supabase
      .from('budget_items')
      .insert([{ ...budgetData, company_id, created_by: req.user.id, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) return res.status(500).json({ message: 'Bütçe kalemi oluşturulamadı' });
    res.status(201).json(budgetItem);
  } catch (error) {
    console.error('Create budget item error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bütçe kalemi detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { data: budgetItem, error } = await supabase
      .from('budget_items')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    if (error || !budgetItem) return res.status(404).json({ message: 'Bütçe kalemi bulunamadı' });
    res.json(budgetItem);
  } catch (error) {
    console.error('Get budget item error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bütçe kalemi güncelle
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().notEmpty().trim(),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'paid', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    const { data: budgetItem, error } = await supabase
      .from('budget_items')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    if (error || !budgetItem) return res.status(404).json({ message: 'Bütçe kalemi bulunamadı' });
    res.json(budgetItem);
  } catch (error) {
    console.error('Update budget item error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bütçe kalemi sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    if (error) return res.status(500).json({ message: 'Bütçe kalemi silinemedi' });
    res.json({ message: 'Bütçe kalemi başarıyla silindi' });
  } catch (error) {
    console.error('Delete budget item error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bütçe kategorilerini getir
router.get('/categories', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { data: categories, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('company_id', company_id)
      .order('name');
    if (error) return res.status(500).json({ message: 'Kategoriler getirilemedi' });
    res.json(categories);
  } catch (error) {
    console.error('Get budget categories error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bütçe kategorisi oluştur
router.post('/categories', [
  body('name').notEmpty().trim(),
  body('type').isIn(['income', 'expense', 'both'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { company_id } = req.user;
    const { name, type } = req.body;
    const { data: category, error } = await supabase
      .from('budget_categories')
      .insert([{ name, type, company_id, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) return res.status(500).json({ message: 'Kategori oluşturulamadı' });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create budget category error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bütçe özet raporu
router.get('/report/summary', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { start_date, end_date, project_id } = req.query;
    let query = supabase
      .from('budget_items')
      .select('amount, type, category, project_id')
      .eq('company_id', company_id);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);
    if (project_id) query = query.eq('project_id', project_id);
    const { data: budgetItems, error } = await query;
    if (error) return res.status(500).json({ message: 'Bütçe raporu oluşturulamadı' });
    const totalIncome = budgetItems?.filter(i => i.type === 'income').reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
    const totalExpense = budgetItems?.filter(i => i.type === 'expense').reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
    const profit = totalIncome - totalExpense;
    const categoryBreakdown = {};
    budgetItems?.forEach(i => {
      if (!categoryBreakdown[i.category]) categoryBreakdown[i.category] = { income: 0, expense: 0 };
      if (i.type === 'income') categoryBreakdown[i.category].income += parseFloat(i.amount);
      else categoryBreakdown[i.category].expense += parseFloat(i.amount);
    });
    res.json({
      summary: { totalIncome, totalExpense, profit, profitMargin: totalIncome > 0 ? (profit / totalIncome) * 100 : 0 },
      categoryBreakdown,
      itemCount: budgetItems?.length || 0
    });
  } catch (error) {
    console.error('Get budget report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 