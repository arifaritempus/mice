export type Language = 'tr' | 'en';

export const translations = {
  tr: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Raporlar',
    'nav.users': 'Kullanıcılar',
    'nav.settings': 'Ayarlar',
    'nav.search': 'Ara...',
    
    // Login
    'login.title': 'Hoş Geldiniz',
    'login.subtitle': 'Çalışma alanınıza giriş yapın',
    'login.email': 'E-posta Adresi',
    'login.password': 'Şifre',
    'login.remember': 'Beni hatırla',
    'login.forgot': 'Şifremi unuttum?',
    'login.button': 'Giriş Yap',
    'login.loading': 'Giriş Yapılıyor...',
    'login.or': 'Veya şunlarla giriş yapın',
    'login.noAccount': 'Hesabınız yok mu?',
    'login.signup': 'Kayıt Ol',
    'login.terms': 'Kullanım Koşulları',
    'login.privacy': 'Gizlilik Politikası',

    // Dashboard
    'dashboard.revenue': '1. Toplam Gelir',
    'dashboard.activeProjects': '2. Aktif Projeler',
    'dashboard.activeSejours': '3. Aktif Sejourlar',
    'dashboard.upcomingTasks': '4. Yaklaşan İşlemler',
    'dashboard.revenueOverview': 'Gelir Özeti',
    'dashboard.monthlyGrowth': 'Aylık Gelir Büyümesi',
    'dashboard.recentActivity': 'Son İşlemler',

    // Activity Timeline
    'activity.payment': 'ödeme yaptı',
    'activity.upgrade': 'Pro\'ya yükseltti',
    'activity.register': 'kayıt oldu',
    'activity.profile': 'profilini güncelledi',
    'activity.project': 'proje ekledi',
    'activity.sejour': 'sejour ekledi',
    'activity.ticket': 'bilet ekledi',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reports',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.search': 'Search...',
    
    // Login
    'login.title': 'Welcome Back',
    'login.subtitle': 'Log in to your workspace',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.remember': 'Remember me',
    'login.forgot': 'Forgot password?',
    'login.button': 'Log In',
    'login.loading': 'Logging in...',
    'login.or': 'Or sign in with',
    'login.noAccount': 'Don\'t have an account?',
    'login.signup': 'Sign Up',
    'login.terms': 'Terms of Service',
    'login.privacy': 'Privacy Policy',

    // Dashboard
    'dashboard.revenue': '1. Total Revenue',
    'dashboard.activeProjects': '2. Active Projects',
    'dashboard.activeSejours': '3. Active Sejours',
    'dashboard.upcomingTasks': '4. Upcoming Tasks',
    'dashboard.revenueOverview': 'Revenue Overview',
    'dashboard.monthlyGrowth': 'Monthly Revenue Growth',
    'dashboard.recentActivity': 'Recent Activity',

    // Activity Timeline
    'activity.payment': 'made a payment',
    'activity.upgrade': 'upgraded to Pro',
    'activity.register': 'registered',
    'activity.profile': 'updated profile',
    'activity.project': 'added project',
    'activity.sejour': 'added sejour',
    'activity.ticket': 'added ticket',
  }
};

export type TranslationKey = keyof typeof translations.en;
