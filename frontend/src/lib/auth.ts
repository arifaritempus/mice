import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

// Kimlik doğrulama servisleri
export const authService = {
  // Supabase client'ı export et
  supabase,

  // Giriş yap
  async login(credentials: LoginCredentials) {
    const email = credentials.email.trim().toLowerCase();
    console.log('🔵 Login denemesi başladı:', { email, passwordLength: credentials.password.length });
    
    try {
      // Önce mevcut oturumu tamamen temizle (varsa)
      console.log('🔵 Önceki oturum temizleniyor...');
      try {
        await supabase.auth.signOut();
        // Geçici session verilerini temizle
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
        }
        console.log('🔵 Önceki oturum temizlendi');
      } catch (signOutError) {
        console.warn('Önceki oturum temizlenirken hata (devam ediliyor):', signOutError);
      }
      
      console.log('🔵 Supabase auth.signInWithPassword çağrılıyor...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: credentials.password,
      });

      console.log('🔵 signInWithPassword sonucu:', { 
        hasData: !!data, 
        hasError: !!error,
        dataUser: data?.user?.email,
        errorMessage: error?.message
      });

      // Hata varsa hemen log'la
      if (error) {
        console.error('🔴🔴🔴 SUPABASE AUTH ERROR 🔴🔴🔴');
        console.error('Error:', error);
        console.error('Error.status:', error.status);
        console.error('Error.message:', error.message);
        console.error('Error.name:', error.name);
        console.error('Error.code:', error.code);
        console.error('Error.toString():', error.toString());
        console.error('Error JSON:', JSON.stringify(error, null, 2));
        
        // Daha açıklayıcı hata mesajı oluştur
        let errorMessage = error.message || 'Giriş yapılırken bir hata oluştu';
        
        if (error.status === 400) {
          // Supabase'in döndürdüğü hata mesajlarını kontrol et
          const errorMsg = error.message?.toLowerCase() || '';
          
          if (errorMsg.includes('invalid login credentials') || 
              errorMsg.includes('invalid email or password') ||
              errorMsg.includes('email not confirmed') ||
              errorMsg.includes('invalid credentials')) {
            errorMessage = 'E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.';
          } else if (errorMsg.includes('email not confirmed')) {
            errorMessage = 'E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin.';
          } else if (errorMsg.includes('user not found')) {
            errorMessage = 'Kullanıcı bulunamadı. Lütfen e-posta adresinizi kontrol edin.';
          } else {
            errorMessage = `Giriş hatası (${error.status}): ${error.message || 'Bilinmeyen hata'}`;
          }
        }
        
        const customError = new Error(errorMessage);
        (customError as any).status = error.status;
        (customError as any).code = error.code;
        (customError as any).originalError = error;
        throw customError;
      }
      
      console.log('Login başarılı, kullanıcı:', data.user?.id);
      console.log('User email:', data.user?.email);
      console.log('User confirmed:', data.user?.email_confirmed_at);
      return data;
    } catch (error: any) {
      console.error('=== LOGIN CATCH HATASI ===');
      console.error('Error type:', typeof error);
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error status:', error?.status);
      console.error('Error code:', error?.code);
      console.error('Error stack:', error?.stack);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('==========================');
      throw error;
    }
  },

  // Çıkış yap
  async logout() {
    console.log('🔴 authService.logout çağrıldı');
    try {
      // Önce tüm storage'ları temizle (Supabase signOut'tan önce)
      if (typeof window !== 'undefined') {
        try {
          // Session storage'ı da temizle
          sessionStorage.clear();
          console.log('🔴 sessionStorage temizlendi');
          
          // IndexedDB'deki Supabase verilerini de temizle (eğer varsa)
          if ('indexedDB' in window) {
            try {
              indexedDB.databases().then(databases => {
                databases.forEach(db => {
                  if (db.name && (db.name.includes('supabase') || db.name.includes('auth'))) {
                    indexedDB.deleteDatabase(db.name);
                    console.log('🔴 IndexedDB silindi:', db.name);
                  }
                });
              });
            } catch (idbError) {
              console.warn('IndexedDB temizleme hatası:', idbError);
            }
          }
        } catch (storageError) {
          console.error('Storage temizleme hatası:', storageError);
        }
      }
      
      // Supabase session'ını temizle
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut hatası:', error);
        // Hata olsa bile devam et (storage zaten temizlendi)
      } else {
        console.log('🔴 Supabase signOut başarılı');
      }
      
      // Global cache'i de temizle (HMR için)
      if (typeof window !== 'undefined') {
        (window as any).__supabase = undefined;
        (window as any).__publicSupabase = undefined;
      }
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__supabaseInstance = undefined;
        (globalThis as any).__publicSupabaseInstance = undefined;
      }
      
      return true;
    } catch (error) {
      console.error('Logout hatası:', error);
      // Hata olsa bile storage temizlendi, true döndür
      return true;
    }
  },

  // Mevcut kullanıcıyı al
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Profile cache to prevent redundant calls
  _profileCache: {} as Record<string, { data: any, timestamp: number }>,

  // Kullanıcı profilini al - doğrudan Supabase
  async getUserProfile(userId: string) {
    const now = Date.now();
    const cacheKey = userId || 'current';
    
    // Check cache (5 second cache)
    if (this._profileCache[cacheKey] && (now - this._profileCache[cacheKey].timestamp < 5000)) {
       return this._profileCache[cacheKey].data;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const metadata = authUser?.user_metadata || {};

      const { data: directData, error: directErr } = await supabase
        .from('users')
        // select('*') bazi ortamlarda schema cache uyumsuzlugunda 400 verebiliyor.
        // Bu nedenle yalnizca her yerde bulunmasi beklenen alanlari cekiyoruz.
        .select('id,email,role,is_active,full_name,created_at,updated_at')
        .eq('id', userId)
        .maybeSingle();

      let result: any = null;
      if (!directErr && directData) {
        const fullName = (directData as any).full_name || metadata.full_name || '';
        const nameParts = String(fullName).trim().split(' ').filter(Boolean);
        const inferredLastName = nameParts.length > 1 ? (nameParts.pop() as string) : '';
        const inferredFirstName = nameParts.join(' ');

        result = {
          ...directData,
          id: (directData as any).id || userId,
          email: (directData as any).email || authUser?.email || '',
          // Guvenlik: rol yalnizca public.users tablosundan alinmali.
          role: (directData as any).role || 'viewer',
          is_active: (directData as any).is_active ?? true,
          first_name: metadata.first_name || inferredFirstName || '',
          last_name: metadata.last_name || inferredLastName || ''
        };
      } else if (authUser && authUser.id === userId) {
        // users tablosu okunamazsa role icin fail-closed: viewer
        result = {
          id: authUser.id,
          email: authUser.email || '',
          role: 'viewer',
          is_active: true,
          full_name: metadata.full_name || `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
          first_name: metadata.first_name || '',
          last_name: metadata.last_name || ''
        };
      }

      this._profileCache[cacheKey] = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.warn('getUserProfile error:', error);
      return null;
    }
  },


  // Profil güncelle
  async updateProfile(userId: string, profileData: UpdateProfileData) {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data || { id: userId, ...profileData };
  },

  // Şifre değiştir
  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },

  // Şifre sıfırlama e-postası gönder
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  // Kullanıcı kaydı (sadece admin)
  async registerUser(userData: RegisterData) {
    // Önce Supabase Auth'da kullanıcı oluştur
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'user'
      }
    });

    if (error) throw error;

    // Kullanıcı profilini oluştur
    if (!data.user) throw new Error('Kullanıcı oluşturulamadı');
    
    try {
      await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          full_name: `${userData.first_name} ${userData.last_name}`.trim(),
          role: userData.role || 'user',
          is_active: true
        });
    } catch (error) {
      throw error;
    }
    
    return data;
  }
};

// Oturum dinleyicisi
export const authListener = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event: any, session: any) => {
    callback(session?.user || null);
  });
}; 