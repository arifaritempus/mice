const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

if (!content.includes('const getDayNameShort =')) {
  const dayNameFunc = `
  const getDayNameShort = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  };
`;
  content = content.replace('export default function SejourPage() {\n  const router = useRouter();', 'export default function SejourPage() {\n  const router = useRouter();\n' + dayNameFunc);
}

// Check if format is already applied
if (!content.includes('formatDate(sejour.checkInDate)} {getDayNameShort')) {
  // It probably looks like: formatDate(sejour.checkInDate)
  content = content.replace(
    /\{formatDate\(sejour\.checkInDate\)\}/g,
    '{formatDate(sejour.checkInDate)} <span className="text-slate-500 font-medium ml-1">{getDayNameShort(sejour.checkInDate)}</span>'
  );
  content = content.replace(
    /\{formatDate\(sejour\.checkOutDate\)\}/g,
    '{formatDate(sejour.checkOutDate)} <span className="text-slate-500 font-medium ml-1">{getDayNameShort(sejour.checkOutDate)}</span>'
  );
}

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
