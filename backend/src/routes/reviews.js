const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Get all reviews for an event
router.get('/event/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users (*)
      `)
      .eq('event_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single review
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users (*),
        event:events (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Review not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create review
router.post('/', async (req, res) => {
  try {
    // Check if user has a ticket for the event
    const { count, error: ticketError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .eq('event_id', req.body.event_id)
      .eq('user_id', req.body.user_id);

    if (ticketError) throw ticketError;
    if (count === 0) {
      return res.status(403).json({ error: 'You must have a ticket to review this event' });
    }

    // Check if user has already reviewed the event
    const { count: reviewCount, error: reviewError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('event_id', req.body.event_id)
      .eq('user_id', req.body.user_id);

    if (reviewError) throw reviewError;
    if (reviewCount > 0) {
      return res.status(400).json({ error: 'You have already reviewed this event' });
    }

    // Create review
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        ...req.body,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Review not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 