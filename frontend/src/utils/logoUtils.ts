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
 * Resmin base64 datasından orijinal boyutlarını alıp orantılı bir şekilde hedeflenen yüksekliğe göre yeniden boyutlandırır.
 */
async function getScaledDimensions(base64: string, targetHeight: number = 60): Promise<{ width: number; height: number }> {
  if (typeof window === 'undefined') {
    return { width: targetHeight * 2, height: targetHeight }; // Fallback
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      resolve({ width: Math.round(targetHeight * aspectRatio), height: targetHeight });
    };
    img.onerror = () => {
      resolve({ width: targetHeight * 2, height: targetHeight });
    };
    img.src = base64;
  });
}

/**
 * Excel export için logoları al (URL'den base64'e çevirir)
 * @param isDark - Koyu tema mı? (koyu tema için dark logolar, açık tema için light logolar)
 * @returns { iconLogoBase64, wordmarkLogoBase64 } - Base64 formatında logolar
 */
export async function getLogosForExcel(isDark: boolean = false, appSettings?: any): Promise<{
  iconLogoBase64?: string;
  iconWidth?: number;
  iconHeight?: number;
  wordmarkLogoBase64?: string;
  wordmarkWidth?: number;
  wordmarkHeight?: number;
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
        ? (appSettings.darkIconLogo || appSettings.dark_icon_logo || appSettings.lightIconLogo || appSettings.light_icon_logo || '') 
        : (appSettings.lightIconLogo || appSettings.light_icon_logo || appSettings.darkIconLogo || appSettings.dark_icon_logo || '');
      
      wordmarkLogoUrl = isDark 
        ? (appSettings.darkWordmarkLogo || appSettings.dark_wordmark_logo || appSettings.dark_menu_logo || '') 
        : (appSettings.lightWordmarkLogo || appSettings.light_wordmark_logo || appSettings.light_menu_logo || '');
    } else {
      // Fallback if appSettings is not provided
      iconLogoUrl = '';
      wordmarkLogoUrl = '';
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
    
    let iconWidth, iconHeight, wordmarkWidth, wordmarkHeight;

    if (iconLogoBase64) {
      const dims = await getScaledDimensions(iconLogoBase64, 60);
      iconWidth = dims.width;
      iconHeight = dims.height;
    }

    if (wordmarkLogoBase64) {
      const dims = await getScaledDimensions(wordmarkLogoBase64, 50); // Wordmark is usually a bit shorter
      wordmarkWidth = dims.width;
      wordmarkHeight = dims.height;
    }

    // Only return wordmark if it actually exists (don't fallback to icon if user requested B option specifically)
    // Wait, earlier we fell back: wordmarkLogoUrl = (appSettings.darkWordmarkLogo || appSettings.darkIconLogo). 
    // The user explicitly requested: "sol taraflara ikon logo sağ taraflara wordmark logo yoksa koymayacak"
    // We should NOT fallback to icon logo!
    
    return {
      iconLogoBase64,
      iconWidth,
      iconHeight,
      wordmarkLogoBase64,
      wordmarkWidth,
      wordmarkHeight
    };
  } catch (error) {
    console.error('Error getting logos for Excel:', error);
    return {};
  }
}
