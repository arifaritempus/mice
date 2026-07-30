import re

with open("frontend/src/app/requests/page.tsx", "r") as f:
    text = f.read()

# I will replace everything inside `return (` to exactly match the quotes page layout.

new_return = """return (
    <div className="flex flex-col h-full bg-v3-bg">
      <div className="flex-1 overflow-auto p-4 md:p-6 pb-24">
        <div className="flex flex-col xl:flex-row gap-4 mb-4 items-start xl:items-center">
          {/* Left: Title */}
          <div className="shrink-0">
            <h1 className="text-xl font-light text-v3-text">Talepler</h1>
            <p className="text-xs text-v3-muted mt-1">
              MICE operasyonları için otel taleplerini yönetin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="Talep Tarihi"
                startValue={dateStart}
                endValue={dateEnd}
                onStartChange={setDateStart}
                onEndChange={setDateEnd}
                onApply={() => {}}
              />
            </div>
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="Tarih Aralığı"
                startValue={dateStart}
                endValue={dateEnd}
                onStartChange={setDateStart}
                onEndChange={setDateEnd}
                onApply={() => {}}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Firma, Acente, Referans...)"
                tokens={globalTokens}
                inputValue={globalInput}
                suggestions={[]}
                onInputChange={setGlobalInput}
                onAddToken={(value) =>
                  addToken(value, setGlobalTokens, setGlobalInput)
                }
                onRemoveToken={(value) => removeToken(value, setGlobalTokens)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 border-l border-v3-border pl-3">
              <button
                type="button"
                className="bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Excel
              </button>
              {canCreate(Module.QUOTES) && (
                <button
                  onClick={() => {
                    toast.error("Yeni talep oluşturma modülü (veritabanı şemasıyla birlikte) daha sonra eklenecektir.");
                  }}
                  className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Yeni Talep
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-2 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 pr-3">
            <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1">
              DURUM:
            </span>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
              <span className="text-[10px] font-medium uppercase tracking-wider">Tümü</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-transparent border-transparent hover:bg-v3-border text-v3-text">
              <span className="text-[10px] font-medium uppercase tracking-wider">Beklemede</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-transparent border-transparent hover:bg-v3-border text-v3-text">
              <span className="text-[10px] font-medium uppercase tracking-wider">Kabul Edilen</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 bg-transparent border-transparent hover:bg-v3-border text-v3-text">
              <span className="text-[10px] font-medium uppercase tracking-wider">Reddedilen</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">0</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-v3-surface border border-v3-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-v3-border bg-v3-bg/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Talep Tarihi</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Referans</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Tarih Aralığı</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Geceleme</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Firma / Sektör</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Acente</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap">Çalışılan Oteller</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">Toplantı</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">W. Cocktail</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-center">Gala</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-text uppercase tracking-wider whitespace-nowrap text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={11} className="py-20 text-center">
                    <p className="text-v3-muted text-sm font-medium">Filtrelere uygun kayıt bulunamadı.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-v3-border bg-v3-surface">
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={totalCount}
              totalPages={1}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              preferenceKey="requests_page_size"
            />
          </div>
        </div>
      </div>
    </div>
  );
}"""

pattern = r'return \(\s*<div className="max-w-\[1600px\].*\}\s*\);\s*\}'
text = re.sub(pattern, new_return, text, flags=re.DOTALL)

with open("frontend/src/app/requests/page.tsx", "w") as f:
    f.write(text)

print("Updated requests layout.")
