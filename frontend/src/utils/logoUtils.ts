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
export async function getLogosForExcel(isDark: boolean = false): Promise<{
  iconLogoBase64?: string;
  wordmarkLogoBase64?: string;
}> {
  try {
    // Excel export: solda icon, sagda wordmark
    // light = navy logo (for white bg), dark = white logo (for dark bg)
    const iconLogoUrl = isDark 
      ? 'https://gzdfdnfkyedwnameflso.supabase.co/storage/v1/object/public/logos/dark_icon_logo.png' 
      : 'https://gzdfdnfkyedwnameflso.supabase.co/storage/v1/object/public/logos/light_icon_logo.png';
    const wordmarkLogoUrl = isDark 
      ? 'https://gzdfdnfkyedwnameflso.supabase.co/storage/v1/object/public/logos/dark_wordmark_logo.png' 
      : 'https://gzdfdnfkyedwnameflso.supabase.co/storage/v1/object/public/logos/light_wordmark_logo.png';
    
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
