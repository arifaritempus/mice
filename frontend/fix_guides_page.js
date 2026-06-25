const fs = require('fs');

let content = fs.readFileSync('src/app/operations/guides/page.tsx', 'utf8');

// 1. Page wrapper
content = content.replace(
  '<div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 overflow-hidden">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
);

// 2. The entire header, tabs, and filters block
const oldHeaderBlockRegex = /{\/\* Header \*\/}[\s\S]*?(?={\/\* Kokartlı Rehberler Tablosu \*\/})/;

const newHeaderBlock = `{/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">Kokartlı Rehber Yönetimi</h1>
            <p className="text-xs text-slate-400 mt-1">MICE ve Sejour rehber operasyonlarını tek ekrandan yönetin</p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Hizmet Tarihi"
                startValue={dateRange.startDate}
                endValue={dateRange.endDate}
                onStartChange={(v) => setDraftStart(v)}
                onEndChange={(v) => setDraftEnd(v)}
                onApply={handleApplyDates}
              />
            </div>
            
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Voucher, Rehber, Otel vb.)"
                tokens={voucherTokens}
                inputValue={voucherInput}
                suggestions={voucherSuggestions}
                onInputChange={setVoucherInput}
                onAddToken={(value) => addToken(value, setVoucherTokens, setVoucherInput)}
                onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
              />
            </div>

            {/* Clear Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={clearGuidesFilters}
                className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
                title="Filtreleri Temizle"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-3">
              <button
                type="button"
                onClick={exportGuidesToExcel}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                title="Excel İndir"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel İndir
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">KAYNAK:</span>
            <button onClick={() => { setFilter('all'); setPage(1); }} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${filter === 'all' ? 'bg-blue-500/20 border border-blue-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>TÜMÜ</span>
              <span className="font-bold">{typeCounts.all}</span>
            </button>
            <button onClick={() => { setFilter('mice'); setPage(1); }} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${filter === 'mice' ? 'bg-orange-500/20 border border-orange-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>MICE</span>
              <span className="font-bold">{typeCounts.mice}</span>
            </button>
            <button onClick={() => { setFilter('sejour'); setPage(1); }} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${filter === 'sejour' ? 'bg-emerald-500/20 border border-emerald-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>SEJOUR</span>
              <span className="font-bold">{typeCounts.sejour}</span>
            </button>
          </div>
        </div>

        `;

content = content.replace(oldHeaderBlockRegex, newHeaderBlock);

// 3. Table Wrappers
content = content.replace(
  /className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0 relative \${tableBusy \? 'opacity-80' : ''}`}/g,
  'className={`flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px] relative ${tableBusy ? "opacity-80" : ""}`}'
);

content = content.replace(
  '<div className="overflow-auto w-full flex-1">',
  '<div className="flex-1 overflow-auto custom-scrollbar">'
);

content = content.replace(
  '<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">',
  '<table className="w-full text-left border-collapse min-w-[1200px]">'
);

content = content.replace(
  '<thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 transition-colors duration-200">',
  '<thead className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">'
);

// 4. `th` styling (regex replace all)
content = content.replace(/className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"/g, 
  'className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"'
);
content = content.replace(/className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"/g, 
  'className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10"'
);

// 5. `tbody` styling
content = content.replace(
  '<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">',
  '<tbody className="divide-y divide-white/5">'
);

// 6. `tr` hover styling
content = content.replace(
  /className="hover:bg-gray-50 dark:hover:bg-gray-700\/50 transition-colors duration-150"/g,
  'className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0"'
);

// 7. `td` styling
content = content.replace(/px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white/g, 'px-2.5 py-2.5 whitespace-nowrap text-[11px] text-white');
content = content.replace(/px-2 py-2 text-xs text-gray-900 dark:text-white/g, 'px-2.5 py-2.5 text-[11px] text-white');
content = content.replace(/px-2 py-2 text-xs text-gray-500 dark:text-gray-400/g, 'px-2.5 py-2.5 text-[11px] text-slate-300');
content = content.replace(/px-2 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400/g, 'px-2.5 py-2.5 whitespace-nowrap text-[11px] text-slate-300');

// Fix the pagination wrapper
content = content.replace(
  '<div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 mt-auto shrink-0 transition-colors duration-200">',
  '<div className="flex justify-between items-center px-4 py-3 bg-[#0f172a]/60 backdrop-blur-md border-t border-white/10 sm:px-6 mt-auto shrink-0">'
);
content = content.replace(
  '<div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 max-w-full">',
  '<div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">'
);
content = content.replace(
  '<p className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">',
  '<p className="text-xs text-slate-400 whitespace-nowrap">'
);
content = content.replace(
  /className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/g,
  'className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-white/10'
);

// 8. Fix searchTerm logic to use voucherTokens as global search
content = content.replace(
  "searchTerm: '',",
  "searchTerm: voucherTokens.join(' '),"
);

fs.writeFileSync('src/app/operations/guides/page.tsx', content, 'utf8');

console.log("Guides page modernized successfully.");
