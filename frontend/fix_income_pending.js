const fs = require('fs');

let file = 'src/app/accounting/invoices/income/pending/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add missing imports
content = content.replace(
  "import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';",
  "import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
);

// 2. Replace all the token states with globalTokens
const stateRegex = /const \[voucherTokens[\s\S]*?const \[categoryInput, setCategoryInput\] = useState\(''\);/;
content = content.replace(stateRegex, `const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState('');`);

// 3. Remove addToken, removeLastToken, and terms useMemos
const helperRegex = /const addToken = \([\s\S]*?const categoryTerms = useMemo\(\(\) => categoryTokens.map\(\(v\) => v.toLowerCase\(\)\), \[categoryTokens\]\);/;
content = content.replace(helperRegex, '');

// 4. Update filteredItems
const filteredItemsRegex = /const filteredItems = useMemo\(\(\) => \{[\s\S]*?\}\, \[items, voucherTerms, companyTerms, agencyTerms, hotelTerms, categoryTerms\]\);/;
content = content.replace(filteredItemsRegex, `const filteredItems = useMemo(() => {
    const searchTerms = [...globalTokens, globalInput.trim()].filter(Boolean).map(t => t.toLowerCase());
    if (!searchTerms.length) return items;
    
    return items.filter((item) => {
      const isSejour = item.project?.quote_type === 'SEJOUR';
      const category = (item.category_name || '').toLowerCase();
      const hotelSearchTarget = [
        item.project?.hotel_name || '',
        !isSejour ? (item.project?.title || '') : '',
        item.project?.description || '',
        item.description || ''
      ].join(' ').toLowerCase();
      const firmaBarHaystack = (
        item.project?.agency_name ||
        item.project?.agency?.name ||
        (isSejour ? item.project?.company_name : '') ||
        ''
      ).toLowerCase();
      const acenteBarHaystack = (isSejour ? '' : (item.project?.company_name || '')).toLowerCase();
      const voucher = (item.project?.voucher_number || '').toLowerCase();
      const reference = (!isSejour ? (item.project?.title || '') : '').toLowerCase();
      const description = (item.description || '').toLowerCase();

      const searchStr = [
        category, hotelSearchTarget, firmaBarHaystack, acenteBarHaystack, voucher, reference, description
      ].join(' ');

      return searchTerms.every(term => searchStr.includes(term));
    });
  }, [items, globalTokens, globalInput]);`);

// 5. Update wrapper
content = content.replace(
  '<div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-4 bg-gray-50 text-slate-900 dark:bg-gray-900 dark:text-slate-100 w-full min-w-0 transition-colors duration-200 overflow-hidden">\n      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">\n      <div className="w-full min-w-0 flex-1 flex flex-col">'
);

// 6. Fix "Arama ve Filtreleme" Box
const filterBoxRegex = /<div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">[\s\S]*?<\/div>\n      <\/div>/;

content = content.replace(filterBoxRegex, `<div className="flex flex-col gap-4 mt-6 shrink-0">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48 shrink-0">
            <DateRangeFieldAccounting
              label="Fatura Tarihi"
              startValue={dateRange.start}
              endValue={dateRange.end}
              onStartChange={(value) => setDateRange((prev) => ({ ...prev, start: value }))}
              onEndChange={(value) => setDateRange((prev) => ({ ...prev, end: value }))}
            />
          </div>
          <div className="flex-1 min-w-[300px]">
            <MultiTokenFilterInput
              label="Genel Arama (Voucher, Firma, Acente, Otel, Kategori vb.)"
              tokens={globalTokens}
              inputValue={globalInput}
              suggestions={[]}
              onInputChange={setGlobalInput}
              onAddToken={(t) => {
                const trimmed = t.trim();
                if (trimmed && !globalTokens.includes(trimmed)) {
                  setGlobalTokens(prev => [...prev, trimmed]);
                  setGlobalInput('');
                }
              }}
              onRemoveToken={(t) => setGlobalTokens(prev => prev.filter(v => v !== t))}
            />
          </div>
          {(dateRange.start || dateRange.end || globalTokens.length > 0) && (
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' });
                setGlobalTokens([]);
                setGlobalInput('');
              }}
              className="w-10 h-10 shrink-0 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
              title="Filtreleri Temizle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>`);

// 7. Fix Table Wrapper to be unified and use transition
content = content.replace(
  '<div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 flex-1 min-h-0 flex flex-col w-full relative">',
  '<div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl border border-white/10 flex-1 min-h-0 flex flex-col w-full relative mt-4 overflow-hidden">'
);

fs.writeFileSync(file, content, 'utf8');
