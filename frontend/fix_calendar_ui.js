const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/calendar/page.tsx', 'utf8');

// 1. Main wrapper
content = content.replace(
  '<div className="flex flex-col min-h-screen bg-transparent transition-colors duration-300 w-full">',
  '<div className="h-[calc(100vh-2rem)] flex flex-col p-4 lg:p-6 overflow-hidden bg-transparent font-sans text-white w-full">'
);

// 2. Header
content = content.replace(
  '<header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 py-4 lg:px-8">',
  '<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 shrink-0">'
);
content = content.replace(
  '<div className="max-w-[1600px] mx-auto w-full space-y-4">',
  '<div className="w-full space-y-4 xl:space-y-0 xl:flex xl:items-center xl:justify-between">'
);
// We will leave the closing div of max-w for now, or just let it close correctly since we didn't remove it.
// Wait, the structure is:
// <header>
//   <div max-w>
//     <div title and clear buttons>
//     <div filters>
//   </div>
// </header>
// Let's replace the whole header block to be safe.
const headerOld = /<header[\s\S]*?<\/header>/;

const headerNew = `{/* Unified V3 Header */}
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

content = content.replace(headerOld, headerNew);

// 3. Main content area
content = content.replace(
  '<main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 space-y-6">',
  '<main className="flex-1 flex flex-col min-h-0 space-y-4 w-full">'
);

// 4. Currency Summary Cards
content = content.replace(
  /className="bg-white dark:bg-gray-900 p-6 rounded-\[2rem\] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4"/g,
  'className="bg-[#0f172a]/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm space-y-3"'
);

content = content.replace(
  /className="p-3 bg-blue-50 dark:bg-blue-900\/20 text-blue-600 rounded-2xl"/g,
  'className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"'
);

content = content.replace(
  /className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900\/20 rounded-xl transition-all"/g,
  'className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all"'
);

content = content.replace(
  /className="text-2xl font-black text-gray-900 dark:text-white"/g,
  'className="text-xl font-bold text-white"'
);

// 5. Calendar Grid Container
content = content.replace(
  'className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col"',
  'className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex-1 min-h-[400px] flex flex-col overflow-hidden"'
);

// 6. Days of Week Header
content = content.replace(
  'className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"',
  'className="grid grid-cols-7 border-b border-white/5 bg-[#0f172a]/40"'
);

// 7. Calendar Day Cells
content = content.replace(
  /className={\`min-h-\[160px\] p-5 border-r border-b border-gray-100 dark:border-gray-800 group relative transition-all hover:bg-gray-50 dark:hover:bg-gray-800\/50 cursor-pointer \${[\s\S]*?}\`}/,
  'className={`min-h-[120px] p-3 border-r border-b border-white/5 group relative transition-all cursor-pointer ${!isCurrentMonth && viewMode === "monthly" ? "bg-transparent opacity-40" : "bg-transparent hover:bg-white/10"} ${isToday ? "bg-blue-500/10 border-blue-500/30" : ""}`}'
);

content = content.replace(
  /className="absolute inset-0 border border-gray-100 dark:border-gray-800\/50 m-2 rounded-3xl group-hover:border-blue-500\/20 transition-all" \/>/,
  'className="absolute inset-0 border border-white/0 m-1 rounded-xl group-hover:border-white/10 transition-all pointer-events-none" />'
);

content = content.replace(
  /className={\`text-\[10px\] font-black uppercase tracking-widest \${[\s\S]*?}\`}/,
  'className={`text-[11px] font-semibold tracking-wider ${isToday ? "px-2 py-0.5 bg-blue-500/40 text-white rounded-md" : isCurrentMonth || viewMode === "yearly" ? "text-white" : "text-slate-500"}`}'
);

// Currency tags inside day
content = content.replace(
  /className="flex items-center gap-1 text-\[8px\] font-black bg-blue-50 dark:bg-blue-900\/20 px-1\.5 py-0\.5 rounded-md border border-blue-100\/50 dark:border-blue-800\/30"/g,
  'className="flex items-center gap-1 text-[9px] font-semibold bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30"'
);
content = content.replace(
  /className="text-blue-600 dark:text-blue-400"/g,
  'className="text-blue-300"'
);

// Tickets inside day
content = content.replace(
  /className="text-\[9px\] leading-tight p-1\.5 bg-gray-50 dark:bg-gray-800\/80 rounded-lg border border-gray-100 dark:border-gray-700\/50 group-hover:border-blue-500\/30 transition-colors"/g,
  'className="text-[9px] leading-tight p-1.5 bg-[#0f172a]/60 rounded-md border border-white/5 group-hover:border-white/20 transition-colors"'
);
content = content.replace(
  /className="text-gray-900 dark:text-white font-black"/g,
  'className="text-white font-semibold"'
);
content = content.replace(
  /className="text-gray-500 dark:text-gray-400"/g,
  'className="text-slate-400"'
);

fs.writeFileSync('src/app/tickets/calendar/page.tsx', content, 'utf8');

console.log("Calendar page modernized successfully.");
