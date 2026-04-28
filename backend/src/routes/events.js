const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/database');

const router = express.Router();

// Tüm etkinlikleri getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { status, category, start_date, end_date, search, limit = 50 } = req.query;
    
    let query = supabase
      .from('events')
      .select(`
        *,
        customer:customers(name),
        created_by_user:users(name, email),
        tickets(ticket_type, price, available_quantity, sold_quantity)
      `)
      .eq('company_id', company_id);
    
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (start_date) query = query.gte('start_date', start_date);
    if (end_date) query = query.lte('start_date', end_date);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    
    const { data: events, error } = await query
      .order('start_date', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) return res.status(500).json({ message: 'Etkinlikler getirilemedi' });
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik oluştur
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('location').optional().trim(),
  body('category').notEmpty().trim(),
  body('status').isIn(['draft', 'published', 'cancelled', 'completed']),
  body('max_attendees').optional().isInt({ min: 1 }),
  body('customer_id').optional(),
  body('budget').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const eventData = req.body;
    
    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        ...eventData,
        company_id,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Etkinlik oluşturulamadı' });
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        customer:customers(name, email, phone),
        created_by_user:users(name, email, avatar_url),
        tickets(
          *,
          registrations(count)
        ),
        team_members(
          *,
          user:users(name, email, avatar_url)
        )
      `)
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik güncelle
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('location').optional().trim(),
  body('category').optional().notEmpty().trim(),
  body('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']),
  body('max_attendees').optional().isInt({ min: 1 }),
  body('customer_id').optional(),
  body('budget').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id } = req.params;
    const { company_id } = req.user;
    const updateData = req.body;
    updateData.updated_at = new Date().toISOString();
    
    const { data: event, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();
    
    if (error || !event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    
    if (error) return res.status(500).json({ message: 'Etkinlik silinemedi' });
    
    res.json({ message: 'Etkinlik başarıyla silindi' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bilet türleri oluştur
router.post('/:id/tickets', [
  body('ticket_type').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('available_quantity').isInt({ min: 1 }),
  body('description').optional().trim(),
  body('early_bird_end_date').optional().isISO8601(),
  body('early_bird_price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id: event_id } = req.params;
    const { company_id } = req.user;
    const ticketData = req.body;
    
    // Etkinlik kontrolü
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', event_id)
      .eq('company_id', company_id)
      .single();
    
    if (eventError || !event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }
    
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([{
        ...ticketData,
        event_id,
        company_id,
        sold_quantity: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Bilet türü oluşturulamadı' });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bilet türlerini getir
router.get('/:id/tickets', async (req, res) => {
  try {
    const { id: event_id } = req.params;
    const { company_id } = req.user;
    
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', event_id)
      .eq('company_id', company_id)
      .order('price', { ascending: true });
    
    if (error) return res.status(500).json({ message: 'Bilet türleri getirilemedi' });
    
    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik kayıtları
router.post('/:id/register', [
  body('ticket_id').notEmpty(),
  body('attendee_name').notEmpty().trim(),
  body('attendee_email').isEmail().normalizeEmail(),
  body('attendee_phone').optional().trim(),
  body('quantity').isInt({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id: event_id } = req.params;
    const { company_id } = req.user;
    const { ticket_id, quantity, ...attendeeData } = req.body;
    
    // Bilet kontrolü
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .eq('event_id', event_id)
      .eq('company_id', company_id)
      .single();
    
    if (ticketError || !ticket) {
      return res.status(404).json({ message: 'Bilet türü bulunamadı' });
    }
    
    // Stok kontrolü
    if (ticket.available_quantity < ticket.sold_quantity + quantity) {
      return res.status(400).json({ message: 'Yeterli bilet bulunmuyor' });
    }
    
    // Kayıt oluştur
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert([{
        event_id,
        ticket_id,
        company_id,
        ...attendeeData,
        quantity,
        total_amount: ticket.price * quantity,
        status: 'confirmed',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (regError) return res.status(500).json({ message: 'Kayıt oluşturulamadı' });
    
    // Bilet satış sayısını güncelle
    await supabase
      .from('tickets')
      .update({ sold_quantity: ticket.sold_quantity + quantity })
      .eq('id', ticket_id);
    
    res.status(201).json(registration);
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik kayıtlarını getir
router.get('/:id/registrations', async (req, res) => {
  try {
    const { id: event_id } = req.params;
    const { company_id } = req.user;
    const { status, limit = 100 } = req.query;
    
    let query = supabase
      .from('registrations')
      .select(`
        *,
        ticket:tickets(ticket_type, price)
      `)
      .eq('event_id', event_id)
      .eq('company_id', company_id);
    
    if (status) query = query.eq('status', status);
    
    const { data: registrations, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) return res.status(500).json({ message: 'Kayıtlar getirilemedi' });
    
    res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik istatistikleri
router.get('/:id/stats', async (req, res) => {
  try {
    const { id: event_id } = req.params;
    const { company_id } = req.user;
    
    // Bilet satış istatistikleri
    const { data: tickets } = await supabase
      .from('tickets')
      .select('available_quantity, sold_quantity, price')
      .eq('event_id', event_id)
      .eq('company_id', company_id);
    
    // Kayıt istatistikleri
    const { data: registrations } = await supabase
      .from('registrations')
      .select('status, total_amount')
      .eq('event_id', event_id)
      .eq('company_id', company_id);
    
    const totalRevenue = registrations?.reduce((sum, reg) => sum + parseFloat(reg.total_amount), 0) || 0;
    const confirmedRegistrations = registrations?.filter(reg => reg.status === 'confirmed').length || 0;
    const totalTicketsSold = tickets?.reduce((sum, ticket) => sum + ticket.sold_quantity, 0) || 0;
    const totalTicketsAvailable = tickets?.reduce((sum, ticket) => sum + ticket.available_quantity, 0) || 0;
    
    const stats = {
      totalRevenue,
      confirmedRegistrations,
      totalTicketsSold,
      totalTicketsAvailable,
      occupancyRate: totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0,
      averageTicketPrice: totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({ message: 'Etkinlik istatistikleri getirilemedi' });
  }
});

// Etkinlik takım üyeleri
router.post('/:id/team', [
  body('user_id').notEmpty(),
  body('role').notEmpty().trim(),
  body('responsibilities').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { id: event_id } = req.params;
    const { company_id } = req.user;
    const teamData = req.body;
    
    const { data: teamMember, error } = await supabase
      .from('event_team_members')
      .insert([{
        ...teamData,
        event_id,
        company_id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Takım üyesi eklenemedi' });
    
    res.status(201).json(teamMember);
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik takım üyelerini getir
router.get('/:id/team', async (req, res) => {
  try {
    const { id: event_id } = req.params;
    const { company_id } = req.user;
    
    const { data: teamMembers, error } = await supabase
      .from('event_team_members')
      .select(`
        *,
        user:users(name, email, avatar_url)
      `)
      .eq('event_id', event_id)
      .eq('company_id', company_id)
      .order('created_at', { ascending: true });
    
    if (error) return res.status(500).json({ message: 'Takım üyeleri getirilemedi' });
    
    res.json(teamMembers);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 