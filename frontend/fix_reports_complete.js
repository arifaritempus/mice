const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Imports
if (!code.includes('MultiTokenFilterInput')) {
  code = code.replace(
    "import LoadingSpinner from '@/components/LoadingSpinner';",
    "import LoadingSpinner from '@/components/LoadingSpinner';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';\nimport ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';"
  );
}

// 2. State
if (!code.includes('searchTokens')) {
  code = code.replace(
    "const [appliedSearchInput, setAppliedSearchInput] = useState('');",
    "const [appliedSearchInput, setAppliedSearchInput] = useState('');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);"
  );
}

// 3. fetchReport
code = code.replace(
  "const fetchReport = async (params?: { searchValue?: string; pageOverride?: number }) => {\n    setLoading(true);\n    setError('');\n    try {\n      const effectiveSearch = params?.searchValue ?? appliedSearchInput;\n      const searchTerms = parseSearchTerms(effectiveSearch);",
  "const fetchReport = async (params?: { searchValue?: string; pageOverride?: number }) => {\n    setLoading(true);\n    setError('');\n    try {\n      const tokensStr = searchTokens.join(' ');\n      const effectiveSearch = [params?.searchValue ?? appliedSearchInput, tokensStr].filter(Boolean).join(' ').trim();\n      const searchTerms = parseSearchTerms(effectiveSearch);"
);

// 4. clear
code = code.replace(
  "setAppliedSearchInput('');\n                      setOtelFilterInput('');",
  "setAppliedSearchInput('');\n                      setSearchTokens([]);\n                      setOtelFilterInput('');"
);

// 5. Layout changes
// First, replace the main wrapper and remove the inner wrapper
const oldMainWrapper = `<div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">\n      <div className="flex-1 p-4 lg:p-8 space-y-6 max-w-[1920px] mx-auto w-full">`;
const newMainWrapper = `<div className="h-[calc(100vh-2rem)] flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8 max-w-[1920px] mx-auto w-full overflow-hidden transition-colors duration-300">`;
code = code.replace(oldMainWrapper, newMainWrapper);

// Because we removed the inner wrapper, we must delete ONE `</div>` at the end of the file
const endRegex = /<\/div>\s*<\/div>\s*\);\s*}\s*$/;
if (endRegex.test(code)) {
  code = code.replace(endRegex, "</div>\n  );\n}\n");
}

// 6. Header Section Replacement
const oldHeaderRegex = /\{\/\* Header Section - Left Aligned \*\/\}\s*<div className="flex items-center gap-4">[\s\S]*?\{\/\* Categories \*\/\}/;

const newHeader = `{/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Rapor Merkezi</h1>
              <p className="text-xs text-slate-400 mt-1">Sistem verilerinizi analiz edin</p>
            </div>
          </div>
          
          <div className="flex flex-row items-center justify-end gap-3 flex-1 overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
            {/* Presets */}
            <div className="inline-flex bg-[#0f172a]/60 p-1 rounded-xl border border-white/10 shrink-0 h-10">
              {(['bu_hafta', 'bu_ay', 'bu_yil', 'ozel'] as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={\`px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 \${
                    datePreset === preset
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }\`}
                >
                  {preset === 'bu_hafta' ? 'HAFTA' : preset === 'bu_ay' ? 'AY' : preset === 'bu_yil' ? 'YIL' : 'ÖZEL'}
                </button>
              ))}
            </div>

            {/* Dates (Responsive Date Range Field) */}
            {datePreset === 'ozel' && (
              <div className="flex items-center shrink-0 w-[260px] h-10 animate-in fade-in zoom-in-95 duration-200">
                <ResponsiveDateRangeField
                  label=""
                  startValue={startDate}
                  endValue={endDate}
                  onStartChange={(v) => { if(v) setStartDate(v); }}
                  onEndChange={(v) => { if(v) setEndDate(v); }}
                  onApply={() => {}}
                />
              </div>
            )}

            {/* Search (MultiToken) */}
            <div className="flex-[2] min-w-[300px] max-w-lg h-10">
              <MultiTokenFilterInput
                label=""
                placeholder="Arama..."
                inputValue={searchInput}
                onInputChange={setSearchInput}
                tokens={searchTokens}
                suggestions={[]}
                onAddToken={(t) => {
                  if (!searchTokens.includes(t)) {
                    setSearchTokens([...searchTokens, t]);
                    setSearchInput('');
                  }
                }}
                onRemoveToken={(t) => {
                  setSearchTokens(searchTokens.filter(st => st !== t));
                }}
              />
            </div>

            {/* Optional: Otel Filter */}
            {(activeReport.id.includes('otel')) && (
              <div className="flex-1 min-w-[120px] h-10">
                <input
                  list="report-hotels-list"
                  value={otelFilterInput}
                  onChange={(e) => setOtelFilterInput(e.target.value)}
                  placeholder="Otel..."
                  className="w-full h-full bg-[#0f172a]/60 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            )}

            {/* Optional: Opsiyon Filter */}
            {activeReport.id === 'opsiyon_takip' && (
              <div className="flex-1 min-w-[100px] h-10">
                <select
                  value={opsiyonDurumuFilter}
                  onChange={(e) => setOpsiyonDurumuFilter(e.target.value)}
                  className="w-full h-full bg-[#0f172a]/60 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="tum">TÜMÜ</option>
                  {OPSIYON_DURUMU_FILTER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-auto border-l border-white/10 pl-4 h-10">
              <button onClick={() => fetchReport()} className="h-full bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest transition-all">SORGULA</button>
              <button 
                onClick={handleExportExcel} 
                className="h-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-2 px-4 rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                title="Excel'e Aktar"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" /></svg>
                EXCEL
              </button>
              <button onClick={() => { applyPreset('bu_yil'); setSearchInput(''); setAppliedSearchInput(''); setSearchTokens([]); setOtelFilterInput(''); setCurrentPage(1); }} className="h-full w-10 flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl transition-all" title="Filtreleri Temizle">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v5h5"></path></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}`;

code = code.replace(oldHeaderRegex, newHeader);

// 7. Remove the old Unified Controls Bar
// We will replace the entire Content Container header
const oldContentHeaderRegex = /\{\/\* Unified Controls Bar - Single Row Layout \*\/\}[\s\S]*?\{\/\* Table Area \*\/\}/;

const newContentHeader = `{/* Table Area */}`;

code = code.replace(oldContentHeaderRegex, newContentHeader);

// 8. Delete the custom `isDateRangeOpen` portal logic and states
// First, remove the `isDateRangeOpen` and related state
code = code.replace("const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);\n  const [rangeCalendarPos, setRangeCalendarPos] = useState({ top: 0, left: 0 });\n  const [pickerRange, setPickerRange] = useState<[Date | null, Date | null]>([null, null]);\n  const dateRangeRef = useRef<HTMLDivElement>(null);\n  const dateRangeCalendarRef = useRef<HTMLDivElement>(null);\n", "");

// Remove the `useEffect` for clicking outside
const portalRegex = /  useEffect\(\(\) => \{\n    if \(!isDateRangeOpen\) return;\n    const handleClickOutside[\s\S]*?\}, \[isDateRangeOpen, startDate, endDate\]\);\n/;
code = code.replace(portalRegex, "");

// Remove the portal JSX
const portalJsxRegex = /      \{isDateRangeOpen && typeof document !== 'undefined' && createPortal\([\s\S]*?document\.body\n      \}\n/g;
// Wait, the portal string has a newline after body. Let's use string operations instead.
const portalStartStr = "{isDateRangeOpen && typeof document !== 'undefined' && createPortal(";
const portalStartIndex = code.indexOf(portalStartStr);

if (portalStartIndex !== -1) {
  const portalEndStr = "document.body\n      )}\n";
  const portalEndIndex = code.indexOf(portalEndStr, portalStartIndex);
  if (portalEndIndex !== -1) {
    code = code.substring(0, portalStartIndex) + code.substring(portalEndIndex + portalEndStr.length);
  }
}

// 9. Remove `flex-1` from Content Container flex flex-col to allow proper scrolling?
// In our structure, Content Container has `flex-1 min-h-0`. This is correct to take up the remaining space!
// But wait, the previous code had `flex flex-col flex-1 min-h-0` on Content Container. That is correct!

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed reports completely!');
