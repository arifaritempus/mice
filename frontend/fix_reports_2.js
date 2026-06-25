const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Add "bu_hafta" support
code = code.replace(
  "type DatePreset = 'bu_ay' | 'bu_yil' | 'ozel';", // wait, did I remove bu_hafta?
  "type DatePreset = 'bu_hafta' | 'bu_ay' | 'bu_yil' | 'ozel';"
);

// If it's already there but just not in the map array:
code = code.replace(
  /\(\['bu_ay', 'bu_yil', 'ozel'\] as DatePreset\[\]\)/,
  "(['bu_hafta', 'bu_ay', 'bu_yil', 'ozel'] as DatePreset[])"
);

code = code.replace(
  /\{preset === 'bu_ay' \? 'AY' : preset === 'bu_yil' \? 'YIL' : 'ÖZEL'\}/,
  "{preset === 'bu_hafta' ? 'HAFTA' : preset === 'bu_ay' ? 'AY' : preset === 'bu_yil' ? 'YIL' : 'ÖZEL'}"
);

// 2. Change initial date preset to bu_hafta
code = code.replace(
  /const \[datePreset, setDatePreset\] = useState<DatePreset>\('bu_yil'\);/,
  "const [datePreset, setDatePreset] = useState<DatePreset>('bu_hafta');"
);

// Update initial startDate and endDate to be current week instead of current year
code = code.replace(
  /const \[startDate, setStartDate\] = useState\(\(\) => \{\n\s*const now = new Date\(\);\n\s*return `\$\{now\.getFullYear\(\)\}-01-01`;\n\s*\}\);/,
  `const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    return start.toISOString().split('T')[0];
  });`
);

code = code.replace(
  /const \[endDate, setEndDate\] = useState\(\(\) => \{\n\s*const now = new Date\(\);\n\s*return `\$\{now\.getFullYear\(\)\}-12-31`;\n\s*\}\);/,
  `const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end.toISOString().split('T')[0];
  });`
);

// 3. Fix the "Content Container" to make it flex-1 min-h-0 so the table scrolls
code = code.replace(
  '<div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl flex flex-col mt-6">',
  '<div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl flex flex-col flex-1 min-h-0 mt-6 shadow-2xl relative">'
);

// 4. Change Date range inputs to ResponsiveDateRangeField
// We need to import it if not present
if (!code.includes('ResponsiveDateRangeField')) {
  code = code.replace(
    "import LoadingSpinner from '@/components/LoadingSpinner';",
    "import LoadingSpinner from '@/components/LoadingSpinner';\nimport ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';"
  );
}

// Replace the custom date inputs with ResponsiveDateRangeField
const oldDatesRegex = /\{\/\* Dates \*\/\}[\s\S]*?<div className="flex items-center gap-1 shrink-0">[\s\S]*?<\/div>[\s\S]*?<span className="text-slate-400 font-bold">-<\/span>[\s\S]*?<\/div>/;

const newDatesHtml = `{/* Dates */}
              {datePreset === 'ozel' && (
                <div className="flex items-center shrink-0 w-[260px] h-10 animate-in fade-in zoom-in-95 duration-200">
                  <ResponsiveDateRangeField
                    label=""
                    startValue={startDate}
                    endValue={endDate}
                    onStartChange={(v) => {
                      if(v) setStartDate(v);
                    }}
                    onEndChange={(v) => {
                      if(v) setEndDate(v);
                    }}
                    onApply={() => {}}
                  />
                </div>
              )}`;

code = code.replace(oldDatesRegex, newDatesHtml);

// Remove the `isDateRangeOpen` state that was used for custom popup
code = code.replace(/const \[isDateRangeOpen, setIsDateRangeOpen\] = useState\(false\);\n/, '');

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed reports 2');
