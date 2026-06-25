const fs = require('fs');

let content = fs.readFileSync('src/app/accounting/cash-flow/page.tsx', 'utf8');

// 1. Update the Header layout
const headerStart = '<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">';
const headerEndStr = '      </div>\n\n      {/* Main Content Area */}';
const hStartIdx = content.indexOf(headerStart);
const hEndIdx = content.indexOf(headerEndStr);

if (hStartIdx !== -1 && hEndIdx !== -1) {
  const newHeader = `<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        {/* Left Side */}
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">Nakit Akışı</h1>
          <p className="text-xs text-slate-400 mt-1">Takvim üzerinden nakit akışınızı yönetin</p>
        </div>

        {/* Right Side */}
        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          
          {/* Calendar Nav */}
          <div className="flex items-center h-10 bg-[#0f172a]/60 p-1 rounded-xl border border-white/10 shrink-0 min-w-[200px]">
            <button
              onClick={goToPreviousPeriod}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center flex items-center justify-center">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
                {getViewTitle()}
              </span>
            </div>
            <button
              onClick={goToNextPeriod}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex h-10 bg-[#0f172a]/60 p-1 rounded-xl border border-white/10 shrink-0">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={\`px-3 rounded-lg text-[10px] font-semibold transition-all uppercase flex items-center justify-center \${viewMode === mode ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}
              >
                {mode === 'daily' ? 'GÜN' : mode === 'weekly' ? 'HAFTA' : mode === 'monthly' ? 'AY' : 'YIL'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-[2] min-w-[300px]">
            <MultiTokenFilterInput
              label="Genel Arama (Proje, Firma, Açıklama vb.)"
              tokens={searchTokens}
              inputValue={searchTerm}
              suggestions={[]}
              onInputChange={setSearchTerm}
              onAddToken={(val) => {
                const trimmed = val.trim();
                if (trimmed && !searchTokens.includes(trimmed)) {
                  setSearchTokens(prev => [...prev, trimmed]);
                  setSearchTerm('');
                }
              }}
              onRemoveToken={(val) => setSearchTokens(prev => prev.filter(t => t !== val))}
            />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchTokens([]);
                setViewMode('monthly');
                setCurrentDate(new Date());
              }}
              className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
              title="Temizle"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={exportCashFlowExcel}
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase"
            >
              <Download size={14} /> Excel İndir
            </button>
          </div>
        </div>
      </div>`;
  content = content.substring(0, hStartIdx) + newHeader + content.substring(hEndIdx);
}

// 2. Change setViewMode('custom') back to 'monthly' default
content = content.replace("const [viewMode, setViewMode] = useState<ViewMode>('custom');", "const [viewMode, setViewMode] = useState<ViewMode>('monthly');");

// 3. In PeriodDetailModal, show all currencies in a grid
const oldGridStart = '<div className="grid grid-cols-2 gap-4 mt-2">';
const oldGridEnd = '</div>\n            </div>\n\n            <div className="space-y-4 pt-4">';
const ogStartIdx = content.indexOf(oldGridStart);
const ogEndIdx = content.indexOf(oldGridEnd);

if (ogStartIdx !== -1 && ogEndIdx !== -1) {
  const newGrid = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {['TRY', 'USD', 'EUR', 'GBP'].map((curr) => {
                const coll = selectedPeriod.totals[curr as keyof typeof selectedPeriod.totals].collection;
                const pay = selectedPeriod.totals[curr as keyof typeof selectedPeriod.totals].payment;
                
                // Eğer tahsilat veya ödeme varsa kutuyu göster, yoksa gösterme (veya hepsini gösterip 0 yaz)
                // Şimdilik hepsini gösterelim
                return (
                  <div key={curr} className="bg-[#0f172a]/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{curr} ÖZETİ</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-500">TAHSİLAT</span>
                        <span className="text-sm font-black text-white glow-text">{formatCurrency(coll, curr).replace(/[^\\d,. ]/g, '')}</span>
                      </div>
                      <div className="h-[1px] w-full bg-white/5" />
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-rose-500">ÖDEME</span>
                        <span className="text-sm font-black text-white glow-text">{formatCurrency(pay, curr).replace(/[^\\d,. ]/g, '')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}`;
  content = content.substring(0, ogStartIdx) + newGrid + content.substring(ogEndIdx);
}

// Ensure custom view doesn't break if dates are empty since we removed them
// Actually we didn't remove dateStart, dateEnd state hooks, we just initialized them to current month.
// Since they are not exposed in UI anymore, custom mode isn't accessible, so it won't break.

fs.writeFileSync('src/app/accounting/cash-flow/page.tsx', content, 'utf8');
console.log("Header and Modal updated");
