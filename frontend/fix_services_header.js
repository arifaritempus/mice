const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/services/page.tsx', 'utf8');

// The block to replace: from {/* Modern Tabs */} down to {/* Search and Date Filters */} block end.
const oldHeaderBlockRegex = /{\/\* Modern Tabs \*\/}[\s\S]*?(?={\/\* Hatalar\/Loading \*\/})/;

const newHeaderBlock = `{/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">Sejour Hizmet Listesi</h1>
            <p className="text-xs text-slate-400 mt-1">Sejour hizmet kalemlerini inceleyin ve filtreleyin</p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="C-IN C-OUT Tarihi"
                startValue={activeTab === 'sales' ? salesFromDate : costFromDate}
                endValue={activeTab === 'sales' ? salesToDate : costToDate}
                onStartChange={activeTab === 'sales' ? setSalesFromDate : setCostFromDate}
                onEndChange={activeTab === 'sales' ? setSalesToDate : setCostToDate}
                onApply={activeTab === 'sales' ? handleApplySalesDates : handleApplyCostDates}
              />
            </div>
            
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Voucher No, Müşteri, Otel, Misafir)"
                tokens={activeTab === 'sales' ? salesVoucherTokens : costVoucherTokens}
                inputValue={activeTab === 'sales' ? salesVoucherInput : costVoucherInput}
                suggestions={voucherSuggestions}
                onInputChange={activeTab === 'sales' ? setSalesVoucherInput : setCostVoucherInput}
                onAddToken={(value) => activeTab === 'sales'
                  ? addToken(value, setSalesVoucherTokens, setSalesVoucherInput)
                  : addToken(value, setCostVoucherTokens, setCostVoucherInput)}
                onRemoveToken={(value) => activeTab === 'sales'
                  ? removeToken(value, setSalesVoucherTokens)
                  : removeToken(value, setCostVoucherTokens)}
              />
            </div>

            {/* Clear Button */}
            <div className="shrink-0">
              <button
                onClick={clearServicesFilters}
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
                onClick={exportSalesExcel}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                title="Satış Excel'e Aktar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Satış Excel
              </button>
              <button
                onClick={exportCostsExcel}
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
                title="Alış Excel'e Aktar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Alış Excel
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip for Tabs */}
        <div className="flex flex-wrap items-center gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">VERİ TÜRÜ:</span>
            <button
              onClick={() => { setActiveTab('sales'); setPage(1); }}
              className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${activeTab === 'sales' ? 'bg-blue-500/20 border border-blue-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}
            >
              <span>SATIŞ HİZMETLERİ</span>
            </button>
            <button
              onClick={() => { setActiveTab('costs'); setPage(1); }}
              className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${activeTab === 'costs' ? 'bg-emerald-500/20 border border-emerald-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}
            >
              <span>ALIŞ HİZMETLERİ</span>
            </button>
          </div>
        </div>

        `;

content = content.replace(oldHeaderBlockRegex, newHeaderBlock);

fs.writeFileSync('src/app/sejour/services/page.tsx', content, 'utf8');

console.log("Services header fixed.");
