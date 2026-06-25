const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/calendar/page.tsx', 'utf8');

const oldHeaderStart = '<header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 py-4 lg:px-8">';
const oldHeaderEnd = '</header>';

const startIndex = content.indexOf(oldHeaderStart);
if (startIndex !== -1) {
  const endIndex = content.indexOf(oldHeaderEnd, startIndex) + oldHeaderEnd.length;
  const newHeader = `{/* Unified V3 Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center justify-between xl:justify-start gap-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">
            Bilet Takvimi
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllFilters}
              className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 shadow-sm"
              title="Temizle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => exportCalendarExcel()}
              className="p-2.5 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex items-center gap-2 px-5 text-[10px] font-black"
            >
              <Download className="w-4 h-4" />
              DIŞA AKTAR
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 xl:justify-end">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={goToPreviousPeriod}
              className="p-2 text-slate-300 rounded-xl hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 min-w-[120px] text-center">
              <span className="text-[11px] font-bold text-white uppercase tracking-tight whitespace-nowrap">
                {getViewTitle()}
              </span>
            </div>
            <button
              onClick={goToNextPeriod}
              className="p-2 text-slate-300 rounded-xl hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex bg-[#0f172a]/40 p-1 rounded-2xl shadow-inner border border-white/5">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={\`px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase \${viewMode === mode ? 'bg-blue-500/20 text-white shadow-md border border-blue-500/50' : 'text-slate-400 hover:text-slate-200'}\`}
              >
                {mode === 'daily' ? 'GÜN' : mode === 'weekly' ? 'HAFTA' : mode === 'monthly' ? 'AY' : 'YIL'}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative group flex-1 min-w-[240px] max-w-sm">
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
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500/20 text-[10px] font-bold text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all uppercase tracking-widest border border-blue-500/30 xl:ml-auto"
          >
            BUGÜN
          </button>
        </div>
      </div>`;
  
  content = content.slice(0, startIndex) + newHeader + content.slice(endIndex);
  fs.writeFileSync('src/app/tickets/calendar/page.tsx', content, 'utf8');
  console.log('Header successfully replaced.');
} else {
  console.log('Old header start not found.');
}
