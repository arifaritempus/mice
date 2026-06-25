export function formatCurrency(
  amount: number | string | null | undefined,
  language: 'tr' | 'en' = 'tr',
  currencyCode?: string
): string {
  if (amount === null || amount === undefined) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';

  // Default currencies based on language if none provided
  const targetCurrency = currencyCode || (language === 'tr' ? 'TRY' : 'USD');
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch (e) {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: language === 'tr' ? 'TRY' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }
}
