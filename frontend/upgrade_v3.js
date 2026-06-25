const fs = require('fs');

let content = fs.readFileSync('src/app/accounting/cash-flow/page.tsx', 'utf8');

// The main container
content = content.replace(
  '<div className="flex flex-col min-h-screen bg-transparent transition-colors duration-300 w-full">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white"><div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">'
);

// We need to close the inner div we opened at the bottom.
const returnEnd = `      </div>
    );
  }

  if (loading) {`;
// Actually, I'll just append a closing </div> before the final `  );\n}`
content = content.replace(
  `        {isPeriodModalOpen && selectedPeriod && (
          <PeriodDetailModal />
        )}
      </main>
    </div>
  );
}`,
  `        {isPeriodModalOpen && selectedPeriod && (
          <PeriodDetailModal />
        )}
      </main>
      </div>
    </div>
  );
}`
);


// Unified Header
const headerStart = '<header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 py-4 lg:px-8">';
const headerEnd = '</header>';
const hStartIdx = content.indexOf(headerStart);
const hEndIdx = content.indexOf(headerEnd);

if (hStartIdx !== -1 && hEndIdx !== -1) {
  content = content.replace(
    content.substring(hStartIdx, hEndIdx + headerEnd.length),
    `<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        {/* Left Side */}
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">Nakit Akışı</h1>
          <p className="text-xs text-slate-400 mt-1">Nakit akışını takip edin ve yönetin</p>
        </div>

        {/* Right Side */}
        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          
          <div className="flex items-center h-10 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            {/* View Mode Switcher */}
            {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={\`px-3 rounded-lg text-[10px] font-semibold transition-all uppercase flex items-center justify-center h-full \${viewMode === mode ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}
              >
                {mode === 'daily' ? 'GÜN' : mode === 'weekly' ? 'HAFTA' : mode === 'monthly' ? 'AY' : mode === 'yearly' ? 'YIL' : 'ÖZEL'}
              </button>
            ))}
          </div>

          {/* Special Date Filter */}
          <AnimatePresence>
            {viewMode === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="w-[240px] shrink-0"
              >
                <DateRangeFieldAccounting
                  label="Tarih Aralığı"
                  startValue={dateStart}
                  endValue={dateEnd}
                  onStartChange={setDateStart}
                  onEndChange={setDateEnd}
                  hideLabel
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-[2] min-w-[240px] relative max-w-sm shrink-0">
            <input
              type="text"
              placeholder="Genel Arama (Proje, Firma vb.)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-[11px] font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setDateStart('');
                setDateEnd('');
                setViewMode('monthly');
              }}
              className="w-10 h-10 inline-flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              title="Sıfırla"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={exportCashFlowExcel}
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase"
            >
              <Download size={14} /> EXCEL İNDİR
            </button>
          </div>
        </div>
      </div>`
  );
}

// Modify Main layout structure to prevent infinite scroll issue
content = content.replace(
  '<main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 lg:px-8 pt-6 pb-6 gap-6">',
  '<main className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col flex-1 min-h-0"><div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">'
);
content = content.replace(
  '        {/* Stats Section */}',
  `        {/* Takvim Navigasyonu */}\n        <div className="flex items-center justify-between bg-[#0f172a]/40 p-3 rounded-2xl border border-white/10 shrink-0 mb-4">
          <div className="flex items-center gap-4">
            <button onClick={goToPreviousPeriod} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <div className="min-w-[150px] text-center"><span className="text-sm font-bold text-white tracking-wide">{getViewTitle()}</span></div>
            <button onClick={goToNextPeriod} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <button onClick={goToToday} className="px-4 py-2 bg-blue-500/20 text-[10px] font-bold text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all uppercase tracking-widest border border-blue-500/30">BUGÜN</button>
        </div>\n\n        {/* Stats Section */}`
);
content = content.replace(
  `        {isPeriodModalOpen && selectedPeriod && (
          <PeriodDetailModal />
        )}
      </main>
      </div>
    </div>
  );`,
  `        {isPeriodModalOpen && selectedPeriod && (
          <PeriodDetailModal />
        )}
        </div>
      </main>
      </div>
    </div>
  );`
);

// Basic Color & Dark Mode Class Replacements (using Regex)
content = content.replace(/bg-white dark:bg-gray-800/g, 'bg-[#0f172a]/40 backdrop-blur-md');
content = content.replace(/bg-gray-50 dark:bg-gray-900\/50/g, 'bg-white/5');
content = content.replace(/bg-gray-100 dark:bg-gray-800/g, 'bg-white/5');
content = content.replace(/border-gray-200 dark:border-gray-700/g, 'border-white/10');
content = content.replace(/border-gray-100 dark:border-gray-800/g, 'border-white/10');
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white glow-text');
content = content.replace(/text-gray-800 dark:text-gray-100/g, 'text-white');
content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-slate-400');
content = content.replace(/text-gray-500/g, 'text-slate-400');
content = content.replace(/text-gray-400/g, 'text-slate-500');
content = content.replace(/hover:bg-gray-50 dark:hover:bg-gray-700/g, 'hover:bg-white/10');
content = content.replace(/hover:bg-gray-100 dark:hover:bg-gray-700/g, 'hover:bg-white/10');
content = content.replace(/dark:text-gray-300/g, 'text-slate-300');
content = content.replace(/text-gray-900/g, 'text-white');
content = content.replace(/bg-gray-100/g, 'bg-white/5');
content = content.replace(/dark:bg-gray-900\/20/g, 'bg-white/5');

// For Period Card specific
content = content.replace(/border-blue-500\/30 dark:border-blue-500\/50/g, 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]');

// Save it back
fs.writeFileSync('src/app/accounting/cash-flow/page.tsx', content, 'utf8');
console.log("V3 transformation complete.");

