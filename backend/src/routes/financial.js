const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm finansal işlemleri getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { type, category, start_date, end_date, search } = req.query;
    let query = supabase
      .from('financial_transactions')
      .select(`
        *,
        project:projects(name),
        customer:customers(name),
        vendor:vendors(name)
      `)
      .eq('company_id', company_id);
    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (start_date) query = query.gte('transaction_date', start_date);
    if (end_date) query = query.lte('transaction_date', end_date);
    if (search) query = query.or(`description.ilike.%${search}%,reference.ilike.%${search}%`);
    const { data: transactions, error } = await query.order('transaction_date', { ascending: false });
    if (error) return res.status(500).json({ message: 'Finansal işlemler getirilemedi' });
    res.json(transactions);
  } catch (error) {
    console.error('Get financial transactions error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Finansal işlem oluştur
router.post('/', [
  body('amount').isFloat({ min: 0 }),
  body('type').isIn(['income', 'expense']),
  body('category').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('transaction_date').isISO8601(),
  body('status').isIn(['pending', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { company_id } = req.user;
    const transactionData = req.body;
    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .insert([{ ...transactionData, company_id, created_by: req.user.id, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) return res.status(500).json({ message: 'Finansal işlem oluşturulamadı' });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create financial transaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Finansal işlem detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        project:projects(name),
        customer:customers(name),
        vendor:vendors(name)
      `)
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    if (error || !transaction) return res.status(404).json({ message: 'Finansal işlem bulunamadı' });
    res.json(transaction);
  } catch (error) {
    console.error('Get financial transaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Finansal işlem güncelle
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0 }),
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().notEmpty().trim(),
  body('description').optional().notEmpty().trim(),
  body('transaction_date').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    if (error || !transaction) return res.status(404).json({ message: 'Finansal işlem bulunamadı' });
    res.json(transaction);
  } catch (error) {
    console.error('Update financial transaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Finansal işlem sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    if (error) return res.status(500).json({ message: 'Finansal işlem silinemedi' });
    res.json({ message: 'Finansal işlem başarıyla silindi' });
  } catch (error) {
    console.error('Delete financial transaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Finansal özet raporu
router.get('/report/summary', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { start_date, end_date, project_id } = req.query;
    let query = supabase
      .from('financial_transactions')
      .select('amount, type, category, transaction_date')
      .eq('company_id', company_id);
    if (start_date) query = query.gte('transaction_date', start_date);
    if (end_date) query = query.lte('transaction_date', end_date);
    if (project_id) query = query.eq('project_id', project_id);
    const { data: transactions, error } = await query;
    if (error) return res.status(500).json({ message: 'Finansal rapor oluşturulamadı' });
    const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const profit = totalIncome - totalExpense;
    const categoryBreakdown = {};
    transactions?.forEach(t => {
      if (!categoryBreakdown[t.category]) categoryBreakdown[t.category] = { income: 0, expense: 0 };
      if (t.type === 'income') categoryBreakdown[t.category].income += parseFloat(t.amount);
      else categoryBreakdown[t.category].expense += parseFloat(t.amount);
    });
    res.json({
      summary: { totalIncome, totalExpense, profit, profitMargin: totalIncome > 0 ? (profit / totalIncome) * 100 : 0 },
      categoryBreakdown,
      transactionCount: transactions?.length || 0
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Aylık finansal raporu
router.get('/report/monthly', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('amount, type, transaction_date')
      .eq('company_id', company_id)
      .gte('transaction_date', `${currentYear}-01-01`)
      .lte('transaction_date', `${currentYear}-12-31`);
    if (error) return res.status(500).json({ message: 'Aylık rapor oluşturulamadı' });
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      profit: 0
    }));
    transactions?.forEach(t => {
      const month = new Date(t.transaction_date).getMonth();
      if (t.type === 'income') monthlyData[month].income += parseFloat(t.amount);
      else monthlyData[month].expense += parseFloat(t.amount);
    });
    monthlyData.forEach(m => m.profit = m.income - m.expense);
    res.json(monthlyData);
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 