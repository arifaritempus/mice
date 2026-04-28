import './globals.css';
import { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PublicLayout from '@/components/PublicLayout';
import { Toaster } from 'react-hot-toast';

function GlobalLoader() {
  return <LoadingSpinner message="Sayfa yükleniyor..." />;
}

export const metadata: Metadata = {
  title: 'TEMPUS TRAVEL - MICE Yönetim Sistemi',
  description: 'TEMPUS TRAVEL MICE Yönetim Sistemi',
  icons: {
    icon: [
      { url: '/LOGO_NAVY.png', sizes: '32x32', type: 'image/png' },
      { url: '/LOGO_OFFWHITE.png', sizes: '32x32', type: 'image/png' }
    ],
    shortcut: '/LOGO_NAVY.png',
    apple: '/LOGO_NAVY.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            try {
              var root = document.documentElement;
              root.classList.remove('light','dark');
              
              // Tema belirleme (cookie tabanlı)
              var cookieMatch = document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);
              var theme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : 'dark';
              if(theme === 'system'){
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              root.classList.add(theme || 'dark');

              // İlk açılışta tema renklerini Supabase'den hızlıca çekip uygula
              fetch('/api/theme-settings', { credentials: 'same-origin' })
                .then(function(r){ return r.ok ? r.json() : null; })
                .then(function(payload){
                  var settings = payload && payload.general_settings;
                  if (!settings) return;
                  var isDark = (theme || 'dark') === 'dark';
                  if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
                  if (settings.secondary_color) root.style.setProperty('--color-secondary', settings.secondary_color);
                  if (settings.success_color) root.style.setProperty('--color-success', settings.success_color);
                  if (settings.warning_color) root.style.setProperty('--color-warning', settings.warning_color);
                  if (settings.error_color) root.style.setProperty('--color-error', settings.error_color);
                  if (settings.info_color) root.style.setProperty('--color-info', settings.info_color);

                  var bgPrimary = isDark ? settings.dark_bg_primary : settings.light_bg_primary;
                  var bgSecondary = isDark ? settings.dark_bg_secondary : settings.light_bg_secondary;
                  var cardBg = isDark ? settings.dark_card_bg : settings.light_card_bg;
                  var textColor = isDark ? settings.dark_text_color : settings.light_text_color;
                  var sidebarBg = isDark ? settings.dark_sidebar_bg : settings.light_sidebar_bg;
                  var sidebarHeaderBg = isDark ? settings.dark_sidebar_header_bg : settings.light_sidebar_header_bg;
                  var sidebarBorder = isDark ? settings.dark_sidebar_border : settings.light_sidebar_border;

                  if (bgPrimary) root.style.setProperty('--theme-bg-primary', bgPrimary);
                  if (bgSecondary) root.style.setProperty('--theme-bg-secondary', bgSecondary);
                  if (cardBg) root.style.setProperty('--theme-card-bg', cardBg);
                  if (textColor) root.style.setProperty('--theme-text-color', textColor);
                  if (sidebarBg) root.style.setProperty('--theme-sidebar-bg', sidebarBg);
                  if (sidebarHeaderBg) root.style.setProperty('--theme-sidebar-header-bg', sidebarHeaderBg);
                  if (sidebarBorder) root.style.setProperty('--theme-sidebar-border', sidebarBorder);
                })
                .catch(function(){});
            } catch (e) {
              document.documentElement.classList.add('dark');
            }
          })();
        `}}
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className="antialiased text-slate-900 dark:text-slate-100 transition-colors duration-200"
        style={{
          backgroundColor: 'var(--theme-bg-primary, #020617)'
        }}
      >
        <ThemeProvider>
          <PublicLayout>
            <Suspense fallback={<GlobalLoader />}>{children}</Suspense>
          </PublicLayout>
          <Toaster position="top-right" reverseOrder={false} />
        </ThemeProvider>
      </body>
    </html>
  );
}