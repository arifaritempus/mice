const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/services/page.tsx', 'utf8');

// The HTML for the filters starts around `<div className="flex flex-col sejour-services-filters-grid items-end gap-2 w-full min-w-0">`
const oldFiltersRegex = /<style dangerouslySetInnerHTML=[\s\S]*?{loading && \(/;

const newFiltersHTML = `        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Sejour Hizmet Listesi</h1>
            <p className="text-sm text-slate-400">Sejour hizmet kalemlerini inceleyin ve filtreleyin.</p>
          </div>

          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="C-IN C-OUT Tarihi"
                startValue={activeTab === 'sales' ? salesFromDate : costFromDate}
                endValue={activeTab === 'sales' ? salesToDate : costToDate}
                onStartChange={activeTab === 'sales' ? setSalesFromDate : setCostFromDate}
                onEndChange={activeTab === 'sales' ? setSalesToDate : setCostToDate}
                onApply={activeTab === 'sales' ? handleApplySalesDates : handleApplyCostDates}
              />
            </div>
            
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
          </div>
        </div>

        {/* Hatalar/Loading */}
        {loading && (`;

content = content.replace(oldFiltersRegex, newFiltersHTML);

// Remove the old header that was replaced in the previous script but is now part of the unified header
const oldHeaderToEraseRegex = /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">[\s\S]*?<div className="flex items-center gap-3">[\s\S]*?<\/div>[\s\S]*?<\/div>/;

// We need to keep the export buttons. Let's put them next to the unified header actions or below the tabs.
const exportButtons = `          <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-sm shrink-0">
          <button
            className={\`px-4 py-2 font-medium text-sm transition-colors duration-200 rounded-lg \${activeTab === 'sales' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}\`}
            onClick={() => { setActiveTab('sales'); setPage(1); }}
          >
            SATIŞ HİZMETLERİ
          </button>
          <button
            className={\`px-4 py-2 font-medium text-sm transition-colors duration-200 rounded-lg \${activeTab === 'costs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}\`}
            onClick={() => { setActiveTab('costs'); setPage(1); }}
          >
            ALIŞ HİZMETLERİ
          </button>
        </div>
        <div className="flex gap-2 mb-2">
            <button onClick={exportSalesExcel} className="bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 text-xs">Satış Excel</button>
            <button onClick={exportCostsExcel} className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 text-xs">Alış Excel</button>
        </div>`;

content = content.replace(/<div className="flex flex-wrap items-center gap-2 mb-4 bg\[#0f172a\]\/40[\s\S]*?<\/button>\n        <\/div>/, exportButtons);

content = content.replace(oldHeaderToEraseRegex, '');

fs.writeFileSync('src/app/sejour/services/page.tsx', content, 'utf8');
console.log("Unified filters applied.");
