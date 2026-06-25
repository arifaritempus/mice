const fs = require('fs');

let content = fs.readFileSync('src/app/marketing/page.tsx', 'utf8');

// 1. Imports
content = content.replace(
  "import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';",
  "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';"
);

// 2. Remove PeriodFilter type
content = content.replace(
  "type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';",
  ""
);

// 3. Remove period state
content = content.replace(
  "const [period, setPeriod] = useState<PeriodFilter>('month');\n",
  ""
);

// 4. Remove useEffect for period
const useEffectStart = "  useEffect(() => {\n    if (period === 'custom') return;";
const useEffectEnd = "  }, [period]);\n";
const effectStartIndex = content.indexOf(useEffectStart);
const effectEndIndex = content.indexOf(useEffectEnd) + useEffectEnd.length;
if (effectStartIndex !== -1) {
  content = content.slice(0, effectStartIndex) + content.slice(effectEndIndex);
}

// 5. Replace UI block in the header
const uiOldStart = '<div className="flex items-center h-10 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">';
const uiOldEnd = '</AnimatePresence>';

const uiStartIndex = content.indexOf(uiOldStart);
const uiEndIndex = content.indexOf(uiOldEnd) + uiOldEnd.length;

if (uiStartIndex !== -1) {
  const uiReplacement = `<div className="w-[240px] shrink-0">
            <ResponsiveDateRangeField
              label="Tarih Aralığı"
              startValue={startDate}
              endValue={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              onApply={() => loadData()}
            />
          </div>`;
  content = content.slice(0, uiStartIndex) + uiReplacement + content.slice(uiEndIndex);
}

fs.writeFileSync('src/app/marketing/page.tsx', content, 'utf8');
console.log("Replaced date filter");
