const fs = require('fs');

let content = fs.readFileSync('src/app/accounting/cash-flow/page.tsx', 'utf8');

// 1. Add missing imports
content = content.replace(
  "import { formatNumber, formatDate, formatCurrency } from '@/utils/formatters';",
  "import { formatNumber, formatDate, formatCurrency } from '@/utils/formatters';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
);

// 2. Add searchTokens state
content = content.replace(
  "const [searchTerm, setSearchTerm] = useState('');",
  "const [searchTerm, setSearchTerm] = useState('');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);"
);

// 3. Update search filter logic
content = content.replace(
  `      // Metin araması
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchString = [
          item.project_title,
          item.project_company,
          item.agency_name,
          item.hotel_name,
          item.description,
          item.project_reference,
          item.collection_type,
          item.payment_type
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchString.includes(term)) {
          matchesSearch = false;
        }
      }`,
  `      // Metin araması ve Token araması
      const searchString = [
        item.project_title,
        item.project_company,
        item.agency_name,
        item.hotel_name,
        item.description,
        item.project_reference,
        item.collection_type,
        item.payment_type
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) {
        matchesSearch = false;
      }
      if (searchTokens.length > 0 && !searchTokens.every(t => searchString.includes(t.toLowerCase()))) {
        matchesSearch = false;
      }`
);

// 4. Update the Root Wrapper
content = content.replace(
  '<div className="flex flex-col min-h-screen bg-transparent transition-colors duration-300 w-full">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
);
content = content.replace(
  '      <style jsx global>{`',
  '      </div>\n      <style jsx global>{`' // Close the new inner wrapper
);

// 5. Replace Header completely
const headerStart = '<header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 py-4 lg:px-8">';
const headerEndStr = '</header>';
const hStartIdx = content.indexOf(headerStart);
const hEndIdx = content.indexOf(headerEndStr) + headerEndStr.length;

if (hStartIdx !== -1 && hEndIdx !== -1) {
  const newHeader = `<div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">Nakit Akışı Takvimi</h1>
          <p className="text-xs text-slate-400 mt-1">Takvim üzerinden nakit akışınızı yönetin</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          <div className="flex items-center h-10 bg-[#0f172a]/60 p-1 rounded-xl border border-white/10 shrink-0 min-w-[200px]">
            <button onClick={goToPreviousPeriod} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center flex items-center justify-center">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider">{getViewTitle()}</span>
            </div>
            <button onClick={goToNextPeriod} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all shrink-0">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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

          <div className="flex-[2] min-w-[300px]">
            <MultiTokenFilterInput
              label="GENEL ARAMA (VOUCHER, PNR, FİRMA VB.)"
              tokens={searchTokens}
              inputValue={searchTerm}
              suggestions={[]}
              onInputChange={setSearchTerm}
              onAddToken={(val) => {
                const trimmed = val.trim();
                if (trimmed && !searchTokens.includes(trimmed)) { setSearchTokens(prev => [...prev, trimmed]); setSearchTerm(''); }
              }}
              onRemoveToken={(val) => setSearchTokens(prev => prev.filter(t => t !== val))}
            />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button onClick={() => { setSearchTerm(''); setSearchTokens([]); setViewMode('monthly'); setCurrentDate(new Date()); }} className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105" title="Filtreleri Temizle">
              <RotateCcw size={14} />
            </button>
            <button onClick={() => exportCashFlowExcel()} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase">
              <Download size={14} /> Excel İndir
            </button>
          </div>
        </div>
      </div>`;
  content = content.substring(0, hStartIdx) + newHeader + content.substring(hEndIdx);
}

// 6. Update Main section wrapper
content = content.replace(
  '<main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 lg:px-8 pt-6 pb-6 gap-6">',
  '<main className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col flex-1 min-h-0"><div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">'
);

// We must close the `<div className="flex-1...` div inside `<main>`
content = content.replace('      </main>\n\n      {/* Modern Detail Modal */}', '        </div>\n      </main>\n\n      {/* Modern Detail Modal */}');

// 7. Update PeriodDetailModal
const oldGridStart = '<div className="grid grid-cols-2 gap-4 mt-2">';
const oldGridEnd = '</div>\n            </div>\n\n            <div className="space-y-4 pt-4">';
const ogStartIdx = content.indexOf(oldGridStart);
const ogEndIdx = content.indexOf(oldGridEnd);

if (ogStartIdx !== -1 && ogEndIdx !== -1) {
  const newGrid = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {['TRY', 'USD', 'EUR', 'GBP'].map((curr) => {
                const coll = selectedPeriod.totals[curr as keyof typeof selectedPeriod.totals].collection;
                const pay = selectedPeriod.totals[curr as keyof typeof selectedPeriod.totals].payment;
                
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
              })}
            </div>`;
  content = content.substring(0, ogStartIdx) + newGrid + content.substring(ogEndIdx + oldGridEnd.length - '            <div className="space-y-4 pt-4">'.length - 1);
}

// 8. Replace ALL basic tailwind colors to V3 style
content = content.replace(/bg-white dark:bg-gray-800/g, 'bg-[#0f172a]/40 backdrop-blur-md');
content = content.replace(/bg-gray-50 dark:bg-gray-900\/50/g, 'bg-white/5');
content = content.replace(/border-gray-200 dark:border-gray-700/g, 'border-white/10');
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white glow-text');
content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-slate-400');
content = content.replace(/text-gray-500/g, 'text-slate-400');
content = content.replace(/dark:text-gray-300/g, 'text-slate-300');
content = content.replace(/dark:bg-gray-700/g, 'bg-white/10');
content = content.replace(/bg-gray-100 dark:bg-gray-800/g, 'bg-[#0f172a]/60');

fs.writeFileSync('src/app/accounting/cash-flow/page.tsx', content, 'utf8');
console.log("Clean upgrade completed");
