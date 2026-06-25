const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. MultiTokenFilterInput import
if (!code.includes('import MultiTokenFilterInput')) {
  code = code.replace(
    "import LoadingSpinner from '@/components/LoadingSpinner';",
    "import LoadingSpinner from '@/components/LoadingSpinner';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
  );
}

// 2. Add searchTokens state
code = code.replace(
  "const [searchInput, setSearchInput] = useState('');",
  "const [searchInput, setSearchInput] = useState('');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);"
);

// 3. Update parseSearchTerms / applyClientSearchTerms to use searchTokens
// Right now applyClientSearchTerms uses a string. We can change it.
code = code.replace(
  /const applyClientSearchTerms = \(rows: DataRow\[\], value: string\) => {[\s\S]*?return rows\.filter\(\(row\) => {[\s\S]*?const haystack = Object\.values\(row\)\.join\(' '\)\.toLocaleLowerCase\('tr-TR'\);[\s\S]*?return terms\.every\(\(term\) => haystack\.includes\(term\)\);[\s\S]*?}\);\n};/,
  `const applyClientSearchTerms = (rows: DataRow[], tokens: string[]) => {
  if (!tokens || !tokens.length) return rows;
  const normalizedTokens = tokens.map(t => t.toLocaleLowerCase('tr-TR'));
  return rows.filter((row) => {
    const haystack = Object.values(row).map(v => v !== null && v !== undefined ? String(v) : '').join(' ').toLocaleLowerCase('tr-TR');
    return normalizedTokens.every((term) => haystack.includes(term));
  });
};`
);

// Update fetchReport client-side filter call
code = code.replace(
  /let filtered = applyClientSearchTerms\(fetchedData, appliedSearchInput\);/,
  `let filtered = applyClientSearchTerms(fetchedData, searchTokens);`
);

// Also since we use searchTokens for fetching directly, we should trigger a refetch or re-filter when searchTokens changes.
// The current logic has appliedSearchInput in the dependency array. We'll change it to searchTokens.
code = code.replace(
  /appliedSearchInput/g,
  'searchTokens'
);

// 4. Update the layout wrapping
code = code.replace(
  /<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">/g,
  `<div className="h-[calc(100vh-2rem)] flex flex-col min-h-0 text-slate-100 p-4 sm:p-6 lg:p-8 overflow-hidden font-sans">`
);

// Replace "Content Container"
// Old: <div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl flex flex-col mt-6">
// New: <div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl flex flex-col flex-1 min-h-0 mt-4 shadow-2xl relative">
code = code.replace(
  /<div className="bg\[#0f172a\]\/40 border border-white\/10 rounded-2xl flex flex-col mt-6">/,
  `<div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl flex flex-col flex-1 min-h-0 mt-4 shadow-2xl relative">`
);

// We need to make sure the table area scrolls
// Old: <div className="overflow-x-auto">
// New: <div className="overflow-auto flex-1 min-h-0 custom-scrollbar relative z-10">
code = code.replace(
  /<div className="overflow-x-auto">/,
  `<div className="overflow-auto flex-1 min-h-0 custom-scrollbar relative z-10">`
);

// The sticky header inside the table wrapper needs bg
code = code.replace(
  /<thead className="bg-\[\#0f172a\]\/95 text-xs text-slate-400 font-semibold sticky top-0 z-20 shadow-sm">/,
  `<thead className="bg-slate-900/60 backdrop-blur-xl text-[10px] uppercase font-black tracking-widest text-slate-400 sticky top-0 z-20">`
);

// 5. Unified Controls Bar
// We move "Dates" next to "Presets"
// And replace SearchInput with MultiTokenFilterInput

// First extract Dates
const datesRegex = /\{\/\* Dates \*\/\}[\s\S]*?<div className="flex items-center gap-1 shrink-0">[\s\S]*?<div className="relative"[^>]*>[\s\S]*?<input[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?<span[^>]*>-<\/span>[\s\S]*?<input[\s\S]*?\/>[\s\S]*?<\/div>/;

const datesMatch = code.match(datesRegex);
let datesBlock = '';
if (datesMatch) {
  datesBlock = datesMatch[0];
  code = code.replace(datesMatch[0], ''); // remove from original position
}

// Now replace Presets + Search + Optional Otel + etc with our new layout
code = code.replace(
  /\{\/\* Presets \*\/\}[\s\S]*?\{\/\* Buttons \*\/}/,
  `{/* Presets */}
              <div className="inline-flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0 h-10">
                {(['bu_ay', 'bu_yil', 'ozel'] as DatePreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className={\`px-3 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 \${
                      datePreset === preset
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }\`}
                  >
                    {preset === 'bu_ay' ? 'AY' : preset === 'bu_yil' ? 'YIL' : 'ÖZEL'}
                  </button>
                ))}
              </div>

              ${datesBlock}

              {/* Search */}
              <div className="flex-[2] min-w-[300px] max-w-lg">
                <MultiTokenFilterInput
                  placeholder="Kayıtlarda arayın (Enter ile çoğaltın)..."
                  tokens={searchTokens}
                  onTokensChange={setSearchTokens}
                  className="h-10"
                />
              </div>

              {/* Optional: Otel Filter */}
              {(activeReport.id.includes('otel')) && (
                <div className="flex-1 min-w-[120px]">
                  <input
                    list="report-hotels-list"
                    value={otelFilterInput}
                    onChange={(e) => setOtelFilterInput(e.target.value)}
                    placeholder="Otel..."
                    className="w-full h-10 bg-[#0f172a]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
              )}

              {/* Optional: Opsiyon Filter */}
              {activeReport.id === 'opsiyon_takip' && (
                <div className="flex-1 min-w-[100px]">
                  <select
                    value={opsiyonDurumuFilter}
                    onChange={(e) => setOpsiyonDurumuFilter(e.target.value)}
                    className="w-full h-10 bg-[#0f172a]/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
                  >
                    <option value="tum">TÜMÜ</option>
                    {OPSIYON_DURUMU_FILTER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Buttons */}`
);

// We should fix the "Dates" block heights to match h-10
code = code.replace(
  /className={`w-\[90px\] rounded-xl px-2 py-2/g,
  'className={`w-[90px] h-10 rounded-xl px-2 py-2'
);

// We should also get rid of `setSearchTokens` missing type errors by not using applySearch anymore.
// We removed applySearch button logic or usage. If there is an applySearch definition, remove it.
code = code.replace(
  /const applySearch = \(\) => \{[\s\S]*?setCurrentPage\(1\);\n  \};\n/,
  ''
);

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed reports UI and logic');
