const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/database');

// Get all categories - use Admin client to bypass RLS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Category not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    // List of known valid columns from current database schema
    const validColumns = [
      'id', 'code', 'name', 'description', 'icon', 'color', 
      'parent_id', 'is_active', 'sort_order',
      'expense_accounting_code', 'revenue_accounting_code',
      'revenue_vat_accounting_code', 'revenue_vat_rate',
      'expense_vat_accounting_code', 'expense_vat_rate'
    ];
    
    // Filter payload to only include columns that exist in the database
    const payload = {};
    for (const key of Object.keys(req.body)) {
      if (validColumns.includes(key)) {
        payload[key] = req.body[key];
      }
    }
    
    // Auto-fill required name if missing in payload but present in body
    if (!payload.name && req.body.name) payload.name = req.body.name;

    if (!payload.name) {
      return res.status(400).json({ message: 'Kategori adı gereklidir' });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([payload])
      .select();

    if (error) {
       console.error('Categories insert 500 error:', error);
       return res.status(500).json({ message: error.message });
    }
    res.status(201).json(data ? data[0] : null);
  } catch (error) {
    console.error('Categories POST critical error:', error);
    res.status(500).json({ message: error.message });
  }
});



// Update category
router.put('/:id', async (req, res) => {
  try {
    const validColumns = [
      'code', 'name', 'description', 'icon', 'color', 
      'parent_id', 'is_active', 'sort_order',
      'expense_accounting_code', 'revenue_accounting_code',
      'revenue_vat_accounting_code', 'revenue_vat_rate',
      'expense_vat_accounting_code', 'expense_vat_rate'
    ];
    
    const payload = {};
    for (const key of Object.keys(req.body)) {
      if (validColumns.includes(key)) {
        payload[key] = req.body[key];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Category not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get events by category
router.get('/:id/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        categories (*),
        organizer:users (*)
      `)
      .eq('category_id', req.params.id)
      .order('start_date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router; 