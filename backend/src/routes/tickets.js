const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events (*),
        user:users (*)
      `)
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single ticket
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events (*),
        user:users (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ticket not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase ticket
router.post('/', async (req, res) => {
  try {
    // Check event capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('capacity, price')
      .eq('id', req.body.event_id)
      .single();

    if (eventError) throw eventError;
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check available tickets
    const { count, error: ticketError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .eq('event_id', req.body.event_id);

    if (ticketError) throw ticketError;
    if (count >= event.capacity) {
      return res.status(400).json({ error: 'Event is sold out' });
    }

    // Create ticket
    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        ...req.body,
        price: event.price,
        status: 'pending',
        purchase_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket status
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: req.body.status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ticket not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel ticket
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 