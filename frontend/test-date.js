const parseDate = (val) => {
    if (!val) return null;
    
    // Excel numeric date
    if (typeof val === 'number') {
      const date = new Date((val - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // String date
    let str = String(val).trim();
    if (str.includes('.')) {
        const parts = str.split('.');
        if (parts.length === 3) {
            // DD.MM.YYYY
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    } else if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            // DD/MM/YYYY or MM/DD/YYYY? Usually DD/MM/YYYY in Turkey
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    } else if (str.includes('-')) {
        // Assume already YYYY-MM-DD if length is 10 and starts with year
        return str;
    }
    return null;
};
console.log(parseDate("15.04.2026"));
console.log(parseDate(45397)); // Some excel number
