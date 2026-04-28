const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı gerekli' });
    }

    const token = authHeader.substring(7);

    let userId = null;
    let supabaseAuthUser = null;
    let userProfile = null;

    // Supabase token denemesi
    const { data: { user }, error: supabaseError } = await supabase.auth.getUser(token);

    if (user && !supabaseError) {
      userId = user.id;
      supabaseAuthUser = user;
    } else {
      // Local JWT denemesi
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (jwtErr) {
        return res.status(401).json({ message: 'Geçersiz token' });
      }
    }

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı kimliği belirsiz' });
    }

    // Profil sorgulama
    const { data, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile fetch error:', profileError);
    }

    if (!data) {
      // Profil yoksa fallback
      if (supabaseAuthUser) {
        userProfile = {
          id: userId,
          email: supabaseAuthUser.email,
          full_name: supabaseAuthUser.user_metadata?.full_name || 
                     `${supabaseAuthUser.user_metadata?.first_name || ''} ${supabaseAuthUser.user_metadata?.last_name || ''}`.trim() || 
                     supabaseAuthUser.email,
          role: supabaseAuthUser.user_metadata?.role || 'user',
          is_active: true
        };
        console.warn(`User profile missing in public.users for ${supabaseAuthUser.email}, using metadata role: ${userProfile.role}`);
      } else {
        return res.status(401).json({ message: 'Kullanıcı profili bulunamadı' });
      }
    } else {
      userProfile = {
        ...data,
        full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email
      };
    }

    if (userProfile && userProfile.is_active === false) {
      return res.status(403).json({ message: 'Hesabınız askıya alınmıştır' });
    }

    req.user = userProfile;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Yetkilendirme hatası' });
  }
};


// Admin yetkisi kontrolü
const adminMiddleware = (req, res, next) => {
  const allowedRoles = ['admin', 'super_admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
  next();
};

// Manager veya admin yetkisi kontrolü
const managerMiddleware = (req, res, next) => {
  const allowedRoles = ['admin', 'manager', 'super_admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Yönetici yetkisi gerekli' });
  }
  next();
};


// Belirli bir kaynağa erişim kontrolü
const resourceAccessMiddleware = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const { company_id } = req.user;

      // Kaynağın şirkete ait olup olmadığını kontrol et
      const { data: resource, error } = await supabase
        .from(resourceType)
        .select('company_id')
        .eq('id', id)
        .eq('company_id', company_id)
        .single();

      if (error || !resource) {
        return res.status(404).json({ message: 'Kaynak bulunamadı' });
      }

      next();
    } catch (error) {
      console.error('Resource access middleware error:', error);
      res.status(500).json({ message: 'Erişim kontrolü hatası' });
    }
  };
};

module.exports = {
  authMiddleware,
  authenticateToken: authMiddleware, // Alias olarak ekle
  adminMiddleware,
  managerMiddleware,
  resourceAccessMiddleware
};