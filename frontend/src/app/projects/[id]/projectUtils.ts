// Helper fonksiyonları - Proje detay sayfası için yardımcı fonksiyonlar

// Tarih formatı fonksiyonları
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  // DD.MM.YYYY formatından YYYY-MM-DD formatına çevir
  const parts = dateString.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateString;
};

// Sayı formatı fonksiyonları (binlik ayırgaç . kuruş ayırgaç ,)
export const formatNumberForDisplay = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0,00';
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Kur (exchange rate) formatı - 4 basamaklı kuruş
export const formatExchangeRateForDisplay = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '1,0000';
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
};

// Input için akıllı formatlama (yazım sırasında cursor pozisyonunu korur)
export const formatNumberForInput = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '';
  
  // Eğer sayı tam sayı ise binlik ayırgaç ekle
  if (num % 1 === 0) {
    return num.toLocaleString('tr-TR');
  }
  
  // Ondalık sayılar için kuruş ayırgaç kullan (4 basamaklı kuruş)
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  });
};

// Input değerini temizleme fonksiyonu
export const cleanInputValue = (value: string): number => {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
};

// Türkçe sayı formatını parse et (binlik ayırıcıları kaldır)
// Örnek: "5.000,50" -> 5000.50, "1.234" -> 1234
export const parseTurkishNumber = (value: string): number => {
  if (!value) return 0;
  // Binlik ayırıcıları (noktaları) kaldır, virgülü noktaya çevir
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// Input değerini formatlama fonksiyonu
export const formatInputValue = (value: string): string => {
  const cleanValue = cleanInputValue(value);
  if (cleanValue === 0) return '';
  return formatNumberForInput(cleanValue);
};

// Tarih formatı fonksiyonları (DD.MM.YYYY)
export const parseDateFromDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('.');
  if (parts.length !== 3) return '';
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
};

// Tam sayı formatı (binlik ayırgaç .)
export const formatIntegerForDisplay = (value: number | string): string => {
  const num = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('tr-TR');
};

export const formatIntegerForInput = (value: string): string => {
  // Türkçe formatından sayıya çevir (1.234 → 1234)
  return value.replace(/\./g, '');
};

// Uçak bileti için tarih formatı
export const formatDateForDisplay = (dateValue: any) => {
  if (!dateValue) return '';
  
  // String olarak geliyorsa
  if (typeof dateValue === 'string') {
    // Eğer zaten DD.MM.YYYY formatındaysa
    if (dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      return dateValue;
    }
    
    // Eğer YYYY-MM-DD formatındaysa (Supabase'ten gelen)
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split('-');
      return `${day}.${month}.${year}`;
    }
    
    return dateValue;
  }
  
  // Date objesi ise
  if (dateValue instanceof Date) {
    const day = dateValue.getDate().toString().padStart(2, '0');
    const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
    const year = dateValue.getFullYear();
    return `${day}.${month}.${year}`;
  }
  
  return String(dateValue);
};

// Tarih ve saat format fonksiyonları
export const formatDateFromSupabase = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const formatTimeFromSupabase = (timeString: string) => {
  if (!timeString) return '';
  // HH:MM:SS -> HH:MM
  return timeString.substring(0, 5);
};

// Supabase'e gönderim için format fonksiyonları
export const formatDateToSupabase = (dateString: string | undefined | null) => {
  if (!dateString || typeof dateString !== 'string') return '';
  // DD.MM.YYYY -> YYYY-MM-DD
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateString;
};

export const formatTimeToSupabase = (timeString: string | undefined | null) => {
  if (!timeString || typeof timeString !== 'string') return '';
  // HH:MM -> HH:MM:SS
  return timeString.length === 5 ? `${timeString}:00` : timeString;
};

// Saat formatı fonksiyonu (HH:MM)
export const formatTimeForDisplay = (timeValue: any) => {
  if (!timeValue) return '';
  
  // String olarak geliyorsa
  if (typeof timeValue === 'string') {
    // Eğer zaten HH:MM formatındaysa
    if (timeValue.match(/^\d{2}:\d{2}$/)) {
      return timeValue;
    }
    
    // Eğer HH:MM:SS formatındaysa (Supabase'ten gelen)
    if (timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeValue.substring(0, 5);
    }
    
    return timeValue;
  }
  
  return String(timeValue);
};

// Formül hesaplama fonksiyonları
export const calculateTotalTRY = (amount: number, rate: number) => {
  return amount * rate;
};

export const calculateAmount = (totalTRY: number, rate: number) => {
  return rate > 0 ? totalTRY / rate : 0;
};

// TR sayı format yardımcıları
export const formatNumberTR = (value: number) => {
  const n = Number(value || 0);
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const formatEUR = (value: number) => `€ ${formatNumberTR(value)}`;
export const formatTRY = (value: number) => `₺ ${formatNumberTR(value)}`;
export const formatNumber = (value: number) => formatNumberTR(value);
export const formatCurrency = (value: number, currency: string = 'EUR') => {
  const symbol = currency === 'USD' ? '$' : currency === 'TRY' ? '₺' : '€';
  return `${symbol} ${formatNumberTR(value)}`;
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateString;
  }
};

// Konaklama için tarih formatı
export const formatDateAccommodation = (dateValue: any) => {
  if (!dateValue) return '';

  // String olarak geliyorsa
  if (typeof dateValue === 'string') {
    // Eğer zaten DD.MM.YYYY formatındaysa
    if (dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      return dateValue;
    }

    // Eğer YYYY-MM-DD formatındaysa (Supabase'ten gelen)
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split('-');
      return `${day}.${month}.${year}`;
    }

    // Eğer uzun tarih formatındaysa (Sun Dec 11 2022 02:00:00 GMT+0200)
    if (dateValue.includes('GMT')) {
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}.${month}.${year}`;
        }
      } catch (e) {
        console.log('Tarih parse hatası:', dateValue);
      }
    }

    // Eğer "11 Aralık" formatındaysa
    if (dateValue.includes(' ')) {
      const monthMap: any = {
        'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04',
        'Mayıs': '05', 'Haziran': '06', 'Temmuz': '07', 'Ağustos': '08',
        'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
      };
      const parts = dateValue.split(' ');
      if (parts.length === 2) {
        const day = parts[0].padStart(2, '0');
        const month = monthMap[parts[1]] || '12';
        return `${day}.${month}.2024`;
      }
    }

    return dateValue;
  }

  // Date objesi ise
  if (dateValue instanceof Date) {
    const day = dateValue.getDate().toString().padStart(2, '0');
    const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
    const year = dateValue.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Number ise (Excel'den gelen tarih numarası)
  if (typeof dateValue === 'number') {
    try {
      // Excel tarih numarasını Date'e çevir
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }
    } catch (e) {
      console.log('Excel tarih parse hatası:', dateValue);
    }
  }

  return '';
};

// Tarih formatını ISO formatına çevir (Supabase için)
export const formatDateForSupabase = (dateValue: any) => {
  if (!dateValue) return null;

  // String olarak geliyorsa
  if (typeof dateValue === 'string') {
    // Eğer DD.MM.YYYY formatındaysa
    if (dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateValue.split('.');
      return `${year}-${month}-${day}`;
    }

    // Eğer uzun tarih formatındaysa
    if (dateValue.includes('GMT')) {
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.log('Tarih parse hatası:', dateValue);
      }
    }

    return dateValue;
  }

  // Date objesi ise
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  return null;
};



