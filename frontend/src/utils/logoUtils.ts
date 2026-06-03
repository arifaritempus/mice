// Logo utility functions for Excel exports

/**
 * URL'den base64'e çevir (Excel export için)
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Logo URL to base64 conversion error:', error);
    throw error;
  }
}

/**
 * Excel export için logoları al (URL'den base64'e çevirir)
 * @param isDark - Koyu tema mı? (koyu tema için dark logolar, açık tema için light logolar)
 * @returns { iconLogoBase64, wordmarkLogoBase64 } - Base64 formatında logolar
 */
export async function getLogosForExcel(isDark: boolean = false, appSettings?: any): Promise<{
  iconLogoBase64?: string;
  wordmarkLogoBase64?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzdfdnfkyedwnameflso.supabase.co';
    
    // Excel export: solda icon, sagda wordmark
    let iconLogoUrl = `${supabaseUrl}/storage/v1/object/public/logos/dark_icon_logo.png`;
    let wordmarkLogoUrl = `${supabaseUrl}/storage/v1/object/public/logos/dark_wordmark_logo.png`;

    if (!appSettings) {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/theme-settings`);
        if (response.ok) {
          const data = await response.json();
          appSettings = data.general_settings;
        }
      } catch (err) {
        console.error('Failed to fetch theme settings for logos', err);
      }
    }

    if (appSettings) {
      iconLogoUrl = isDark 
        ? (appSettings.dark_icon_logo || appSettings.light_icon_logo || iconLogoUrl) 
        : (appSettings.light_icon_logo || appSettings.dark_icon_logo || iconLogoUrl);
      
      wordmarkLogoUrl = isDark 
        ? (appSettings.dark_wordmark_logo || appSettings.dark_menu_logo || appSettings.dark_icon_logo || wordmarkLogoUrl) 
        : (appSettings.light_wordmark_logo || appSettings.light_menu_logo || appSettings.light_icon_logo || wordmarkLogoUrl);
    } else {
      // Fallback if appSettings is not provided
      iconLogoUrl = isDark 
        ? `${supabaseUrl}/storage/v1/object/public/logos/dark_icon_logo.png` 
        : `${supabaseUrl}/storage/v1/object/public/logos/light_icon_logo.png`;
      wordmarkLogoUrl = isDark 
        ? `${supabaseUrl}/storage/v1/object/public/logos/dark_wordmark_logo.png` 
        : `${supabaseUrl}/storage/v1/object/public/logos/light_wordmark_logo.png`;
    }
    
    // Eğer tarayıcı ortamındaysak ve URL '/' ile başlıyorsa, fetch'in çalışabilmesi için tam URL'ye çevir
    const getFullUrl = (url: string) => {
      if (url.startsWith('/') && typeof window !== 'undefined') {
        return window.location.origin + url;
      }
      return url;
    };

    const finalIconUrl = getFullUrl(iconLogoUrl);
    const finalWordmarkUrl = getFullUrl(wordmarkLogoUrl);

    // URL'leri base64'e çevir
    let iconLogoBase64: string | undefined;
    let wordmarkLogoBase64: string | undefined;
    
    if (finalIconUrl.startsWith('http')) {
      try {
        iconLogoBase64 = await urlToBase64(finalIconUrl);
      } catch (error) {
        console.error('Error converting icon logo to base64:', error);
      }
    } else if (finalIconUrl.startsWith('data:')) {
      iconLogoBase64 = finalIconUrl;
    }
    
    if (finalWordmarkUrl.startsWith('http')) {
      try {
        wordmarkLogoBase64 = await urlToBase64(finalWordmarkUrl);
      } catch (error) {
        console.error('Error converting wordmark logo to base64:', error);
      }
    } else if (finalWordmarkUrl.startsWith('data:')) {
      wordmarkLogoBase64 = finalWordmarkUrl;
    }
    
    return {
      iconLogoBase64,
      wordmarkLogoBase64
    };
  } catch (error) {
    console.error('Error getting logos for Excel:', error);
    return {};
  }
}
