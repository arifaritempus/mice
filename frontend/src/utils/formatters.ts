// Sayı formatı fonksiyonu (Türkçe para birimi formatı)
// Binlik ayırgaç: . (nokta)
// Kuruş ayırgaç: , (virgül)
export const formatNumber = (number: number) => {
  return number.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Para birimi ile birlikte format
export const formatCurrency = (number: number, currency: string = '€') => {
  return `${formatNumber(number)} ${currency}`;
};

// Sadece tam sayı formatı (kuruş olmadan)
export const formatInteger = (number: number) => {
  return number.toLocaleString('tr-TR');
};

// Tarih formatı: GG.AA.YYYY
export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

// Tarih aralığı formatı: GG.AA.YYYY - GG.AA.YYYY
export const formatDateRange = (startDate: string | Date, endDate: string | Date) => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// Kısa gün adını döndür (Örn: Pzt, Sal, vs.)
export const getDayNameShort = (date: string | Date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('tr-TR', { weekday: 'short' });
  } catch (e) {
    return '';
  }
}; 