const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/calendar/page.tsx', 'utf8');

// 1. Add MultiTokenFilterInput import
if (!content.includes('import MultiTokenFilterInput')) {
  content = content.replace(
    "import LoadingSpinner from '@/components/LoadingSpinner';",
    "import LoadingSpinner from '@/components/LoadingSpinner';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
  );
}

// 2. Fix the Header component exactly to match the V3 payments header buttons
const oldHeaderStart = '{/* Unified V3 Header */}';
const oldHeaderEnd = '</main>';
const headerStartIndex = content.indexOf(oldHeaderStart);
const mainIndex = content.indexOf(oldHeaderEnd);

if (headerStartIndex !== -1) {
  // Let's replace only the search bar and buttons inside the existing unified header
  // Actually, let's just replace the exact search bar HTML:
  const oldSearchBar = `<div className="relative group flex-1 min-w-[240px] max-w-sm">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0f172a]/40 border border-white/10 focus-within:border-blue-500/50 rounded-2xl transition-all min-h-[36px]">
              <div className="pl-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
              {searchTokens.map((token, idx) => (
                <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white rounded-lg text-[10px] font-bold tracking-tight shadow-sm">
                  {token}
                  <button onClick={() => removeSearchToken(token)} className="hover:text-red-400"><Plus className="w-2.5 h-2.5 rotate-45" /></button>
                </span>
              ))}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchTokens.length === 0 ? "Arama (Proje, Firma, Açıklama...)" : ""}
                className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-bold text-white h-7 px-2 min-w-[80px] placeholder:text-slate-500"
              />
            </div>
          </div>`;

  const newSearchBar = `<div className="flex-[2] min-w-[300px]">
            <MultiTokenFilterInput
              label="Genel Arama (Voucher, PNR, Firma vb.)"
              tokens={searchTokens}
              inputValue={searchQuery}
              suggestions={[]}
              onInputChange={setSearchQuery}
              onAddToken={(val) => {
                const trimmed = val.trim();
                if (trimmed && !searchTokens.includes(trimmed)) {
                  setSearchTokens(prev => [...prev, trimmed]);
                  setSearchQuery('');
                }
              }}
              onRemoveToken={(val) => setSearchTokens(prev => prev.filter(t => t !== val))}
            />
          </div>`;
  content = content.replace(oldSearchBar, newSearchBar);
  
  // Fix the clear button in the header
  const oldClearButton = `<button
              onClick={clearAllFilters}
              className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 shadow-sm"
              title="Temizle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>`;
  const newClearButton = `<button
              onClick={clearAllFilters}
              className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
              title="Filtreleri Temizle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>`;
  content = content.replace(oldClearButton, newClearButton);
  
  // Fix the excel button in the header
  const oldExcelButton = `<button
              onClick={() => exportCalendarExcel()}
              className="p-2.5 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex items-center gap-2 px-5 text-[10px] font-black"
            >
              <Download className="w-4 h-4" />
              DIŞA AKTAR
            </button>`;
  const newExcelButton = `<button
              onClick={() => exportCalendarExcel()}
              className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
              title="Excel İndir"
            >
              <Download className="w-4 h-4" />
              Excel İndir
            </button>`;
  content = content.replace(oldExcelButton, newExcelButton);
}

// 3. Remove .replace(/[^\d,. ]/g, '') from ALL formatCurrency calls
content = content.replace(/\.replace\(\/\[\^\\d\,\. \]\/g, ''\)/g, '');

// 4. Update the movement list details inside calendar day cells
const oldMovementText = `<div className="text-[8px] text-slate-400 mt-0.5 truncate tracking-tighter">
                            {ticket.route || ticket.pnr || '-'}
                          </div>`;
const newMovementText = `<div className="text-[8px] text-slate-400 mt-0.5 truncate tracking-tighter" title={[ticket.project_code, ticket.reference_code, ticket.route, ticket.pnr].filter(Boolean).join(' • ')}>
                            {[ticket.project_code, ticket.reference_code, ticket.route, ticket.pnr].filter(Boolean).join(' • ') || '-'}
                          </div>`;
content = content.replace(oldMovementText, newMovementText);

// Also replace it for the old modal if needed (modal has its own text-gray-900)
// For modals, let's fix the text colors to V3 standard
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white');
content = content.replace(/bg-white dark:bg-gray-900/g, 'bg-[#0f172a] border border-white/10');
content = content.replace(/bg-gray-50 dark:bg-gray-800\/50/g, 'bg-white/5');
content = content.replace(/bg-gray-100 dark:bg-gray-800/g, 'bg-white/10');
content = content.replace(/bg-white dark:bg-gray-800/g, 'bg-[#0f172a]');
content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-slate-400');
content = content.replace(/text-gray-600 dark:text-gray-300/g, 'text-slate-300');
content = content.replace(/border-gray-200 dark:border-gray-700/g, 'border-white/10');
content = content.replace(/border-gray-100 dark:border-gray-800/g, 'border-white/5');

fs.writeFileSync('src/app/tickets/calendar/page.tsx', content, 'utf8');

console.log("Calendar Details fixed successfully.");
