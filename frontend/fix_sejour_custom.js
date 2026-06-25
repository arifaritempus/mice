const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// 1. Currency logic
content = content.replace(/<div>TRY: \{formatNumber\(colTRY\)\}<\/div>/g, '{colTRY !== 0 && <div>TRY: {formatNumber(colTRY)}</div>}');
content = content.replace(/<div>EUR: \{formatNumber\(colEUR\)\}<\/div>/g, '{colEUR !== 0 && <div>EUR: {formatNumber(colEUR)}</div>}');
content = content.replace(/<div>USD: \{formatNumber\(colUSD\)\}<\/div>/g, '{colUSD !== 0 && <div>USD: {formatNumber(colUSD)}</div>}');
content = content.replace(/<div>GBP: \{formatNumber\(colGBP\)\}<\/div>/g, '{colGBP !== 0 && <div>GBP: {formatNumber(colGBP)}</div>}');

content = content.replace(/<div>TRY: \{formatNumber\(balTRY\)\}<\/div>/g, '{balTRY !== 0 && <div>TRY: {formatNumber(balTRY)}</div>}');
content = content.replace(/<div>EUR: \{formatNumber\(balEUR\)\}<\/div>/g, '{balEUR !== 0 && <div>EUR: {formatNumber(balEUR)}</div>}');
content = content.replace(/<div>USD: \{formatNumber\(balUSD\)\}<\/div>/g, '{balUSD !== 0 && <div>USD: {formatNumber(balUSD)}</div>}');
content = content.replace(/<div>GBP: \{formatNumber\(balGBP\)\}<\/div>/g, '{balGBP !== 0 && <div>GBP: {formatNumber(balGBP)}</div>}');

// 2. Dates logic
if (!content.includes('const getDayNameShort =')) {
  const dayNameFunc = `
  const getDayNameShort = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  };
`;
  content = content.replace('export default function SejourPage() {\n', 'export default function SejourPage() {\n' + dayNameFunc);
}
content = content.replace(
  /\{formatDate\(sejour\.checkInDate\)\}/g,
  '{formatDate(sejour.checkInDate)} <span className="text-slate-500 font-medium ml-1">{getDayNameShort(sejour.checkInDate)}</span>'
);
content = content.replace(
  /\{formatDate\(sejour\.checkOutDate\)\}/g,
  '{formatDate(sejour.checkOutDate)} <span className="text-slate-500 font-medium ml-1">{getDayNameShort(sejour.checkOutDate)}</span>'
);

// 3. Oda logic
content = content.replace(
  /Oda \{room\.roomNumber \|\| index \+ 1\}/g,
  '{String(room.roomNumber || "").toLowerCase().includes("oda") ? room.roomNumber : `Oda ${room.roomNumber || index + 1}`}'
);

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
