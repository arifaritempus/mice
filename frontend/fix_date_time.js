const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldParseDate = `  const parseDate = (val: any) => {
    if (!val) return null;
    if (typeof val === 'number') {
      const date = new Date((val - (25567 + 2)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    return val;
  };`;

const newParseDate = `  const parseDate = (val: any) => {
    if (!val) return null;
    if (typeof val === 'number') {
      // Excel tarih
      if (val > 1) {
        const date = new Date((val - (25567 + 2)) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      return null; // Time part only, not a date
    }
    let str = String(val).trim();
    if (str.includes('.')) {
        const parts = str.split('.');
        if (parts.length === 3) return \`\${parts[2]}-\${parts[1].padStart(2, '0')}-\${parts[0].padStart(2, '0')}\`;
    } else if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) return \`\${parts[2]}-\${parts[1].padStart(2, '0')}-\${parts[0].padStart(2, '0')}\`;
    }
    return str;
  };
  
  const parseTime = (val: any) => {
    if (!val) return null;
    if (typeof val === 'number') {
       // Excel saat formatı (0 ile 1 arası ondalık)
       if (val >= 0 && val < 1) {
           const totalSeconds = Math.round(val * 86400);
           const hours = Math.floor(totalSeconds / 3600);
           const minutes = Math.floor((totalSeconds % 3600) / 60);
           return \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}\`;
       }
       // Eğer hem tarih hem saat ise
       if (val >= 1) {
           const frac = val - Math.floor(val);
           const totalSeconds = Math.round(frac * 86400);
           const hours = Math.floor(totalSeconds / 3600);
           const minutes = Math.floor((totalSeconds % 3600) / 60);
           return \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}\`;
       }
    }
    let str = String(val).trim();
    if (str.includes(':')) {
       return str.split(':').slice(0, 2).join(':');
    } else if (str.length === 4 && !isNaN(Number(str))) {
       return \`\${str.substring(0,2)}:\${str.substring(2,4)}\`; // 1000 -> 10:00
    }
    return str;
  };`;

code = code.replace(oldParseDate, newParseDate);

// Now apply parseTime to all time fields in formatting
const replaceList = [
  ['ucus_gidis_saati: row[13],', 'ucus_gidis_saati: parseTime(row[13]),'],
  ['ucus_donus_saati: row[19],', 'ucus_donus_saati: parseTime(row[19]),'],
  ['transfer_gidis_saati: row[25],', 'transfer_gidis_saati: parseTime(row[25]),'],
  ['transfer_donus_saati: row[30],', 'transfer_donus_saati: parseTime(row[30]),'],
  
  ['ucus_gidis_saati: row["gidiş uçuş saati"] || row["kalkış saati"] || row["gidiş saati"] || row["uçuş saati"],', 'ucus_gidis_saati: parseTime(row["gidiş uçuş saati"] || row["kalkış saati"] || row["gidiş saati"] || row["uçuş saati"]),'],
  ['ucus_donus_saati: row["dönüş uçuş saati"] || row["dönüş kalkış saati"] || row["dönüş saati"],', 'ucus_donus_saati: parseTime(row["dönüş uçuş saati"] || row["dönüş kalkış saati"] || row["dönüş saati"]),'],
  ['transfer_gidis_saati: row["gidiş transfer saati"] || row["geliş transfer saati"] || row["transfer saati"],', 'transfer_gidis_saati: parseTime(row["gidiş transfer saati"] || row["geliş transfer saati"] || row["transfer saati"]),'],
  ['transfer_donus_saati: row["dönüş transfer saati"],', 'transfer_donus_saati: parseTime(row["dönüş transfer saati"]),'],
];

replaceList.forEach(([oldS, newS]) => {
   code = code.replace(oldS, newS);
});

// Fix accommodations night calculation with new parsed date which is YYYY-MM-DD
const oldNightsCalc = `          if (cIn && cOut) {
              const dIn = new Date(cIn.split('.').reverse().join('-'));
              const dOut = new Date(cOut.split('.').reverse().join('-'));`;

const newNightsCalc = `          if (cIn && cOut) {
              const dIn = new Date(cIn); // cIn is already YYYY-MM-DD from parseDate
              const dOut = new Date(cOut);`;

code = code.replace(oldNightsCalc, newNightsCalc);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Date and Time parsing fixed!");
