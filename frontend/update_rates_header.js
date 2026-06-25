const fs = require('fs');

let code = fs.readFileSync('src/app/accounting/exchange-rates/page.tsx', 'utf8');

const newHeader = `      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">TCMB Döviz Kurları</h1>
          <p className="text-xs text-slate-400 mt-1">Türkiye Cumhuriyet Merkez Bankası geçmiş ve güncel kurları</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          {/* Period Selector */}
          <div className="flex h-10 bg-[#0f172a]/60 p-1 rounded-xl border border-white/10 shrink-0">
            {([
              { id: 'today', label: 'BUGÜN' },
              { id: 'week', label: 'HAFTA' },
              { id: 'month', label: 'AY' },
              { id: 'year', label: 'YIL' },
              { id: 'custom', label: 'ÖZEL' }
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={\`px-3 rounded-lg text-[10px] font-semibold transition-all uppercase flex items-center justify-center \${
                  period === item.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }\`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="w-[260px] h-10 flex shrink-0 animate-in fade-in zoom-in-95 duration-200">
              <ResponsiveDateRangeField 
                label="" 
                startValue={customStartDate}
                endValue={customEndDate}
                onStartChange={(v) => {
                  if (v) setDateRange([new Date(v), dateRange[1]]);
                  else setDateRange([null, dateRange[1]]);
                }}
                onEndChange={(v) => {
                  if (v) setDateRange([dateRange[0], new Date(v)]);
                  else setDateRange([dateRange[0], null]);
                }}
                onApply={() => {}}
              />
            </div>
          )}

          {/* Fetch Button */}
          <button
            onClick={handleFetchRates}
            disabled={fetching}
            className="flex items-center gap-2 px-4 h-10 bg-[#0f172a]/60 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <RefreshCw className={\`w-3.5 h-3.5 \${fetching ? 'animate-spin' : ''}\`} />
            {fetching ? 'GÜNCELLENİYOR...' : 'ŞİMDİ GÜNCELLE'}
          </button>
        </div>
      </div>`;

// Replace from HEADER up to DATA GRID
code = code.replace(/\{\/\* ═══════════════ HEADER ═══════════════ \*\/\}[\s\S]*?(?=\{\/\* ═══════════════ DATA GRID ═══════════════ \*\/)/, newHeader + '\n\n      ');

fs.writeFileSync('src/app/accounting/exchange-rates/page.tsx', code, 'utf8');
console.log('Fixed header');
