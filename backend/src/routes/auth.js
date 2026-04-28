const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const { emailService } = require('../services/emailService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul (Admin yetkisiyle - RLS bypass)
    // Eğer supabaseAdmin tanımlı değilse normal client kullanılır (RLS hatası verebilir)
    const client = supabaseAdmin || supabase;
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      if (error) console.error('Login user lookup error:', error);
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    // Şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Son giriş tarihini güncelle (Normal client ile - kullanıcının kendi verisini güncellemesi)
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        company_id: user.company_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('company_name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, company_name } = req.body;

    // Email kontrolü (Admin yetkisiyle)
    const client = supabaseAdmin || supabase;
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);

    // Şirket oluştur (Admin yetkisiyle)
    const { data: company, error: companyError } = await client
      .from('companies')
      .insert([{
        name: company_name,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (companyError) {
      console.error('Company creation error:', companyError);
      return res.status(500).json({ message: 'Şirket oluşturulamadı', error: companyError });
    }

    // Kullanıcı oluştur (Admin yetkisiyle)
    const { data: user, error: userError } = await client
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        full_name: name,
        role: 'admin',
        company_id: company.id,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return res.status(500).json({ message: 'Kullanıcı oluşturulamadı', error: userError });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Hoş geldin emaili gönder
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Password Reset Request
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Kullanıcıyı bul
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single();

    if (user) {
      // Reset token oluştur
      const resetToken = jwt.sign(
        { userId: user.id, email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Reset token'ı veritabanına kaydet
      await supabase
        .from('users')
        .update({ reset_token: resetToken, reset_token_expires: new Date(Date.now() + 3600000).toISOString() })
        .eq('id', user.id);

      // Reset emaili gönder
      try {
        await emailService.sendPasswordReset(email, user.name, resetToken);
      } catch (emailError) {
        console.error('Password reset email error:', emailError);
      }
    }

    // Güvenlik için her zaman başarılı mesajı döndür
    res.json({ message: 'Şifre sıfırlama bağlantısı gönderildi' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Password Reset
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı bul ve token'ı kontrol et
    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token, reset_token_expires')
      .eq('id', decoded.userId)
      .single();

    if (!user || user.reset_token !== token || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);

    // Şifreyi güncelle ve token'ları temizle
    await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', user.id);

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profile Update
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name: name || undefined,
        phone: phone || undefined,
        avatar_url: avatar_url || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Profil güncellenemedi' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role,
        company_id: user.company_id
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Change Password
router.put('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Mevcut kullanıcıyı al
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    // Mevcut şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Şifreyi güncelle
    await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Verify Token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router; 