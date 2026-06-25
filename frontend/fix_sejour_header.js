const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

const startStr = '{/* Header */}';
const endStr = '{/* Main Content */}';
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const newHeader = `{/* Unified Header */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-2">
        {/* Left: Title */}
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text">Sejour Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-1">Sejour işlemlerini yönetin</p>
        </div>

        {/* Right: All Filters and Actions */}
        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          {/* Dates */}
          <div className="w-[240px] shrink-0">
            <ResponsiveDateRangeField
              label="Konaklama Tarihi"
              startValue={dateStart}
              endValue={dateEnd}
              onStartChange={setDateStart}
              onEndChange={setDateEnd}
              onApply={handleApplyDates}
            />
          </div>

          {/* Search Filters */}
          <div className="w-[200px] shrink-0">
            <MultiTokenFilterInput
              label="Voucher No"
              tokens={voucherTokens}
              inputValue={voucherInput}
              suggestions={voucherSuggestions}
              onInputChange={setVoucherInput}
              onAddToken={(value) => addToken(value, setVoucherTokens, setVoucherInput)}
              onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
            />
          </div>
          <div className="w-[200px] shrink-0">
            <MultiTokenFilterInput
              label="Müşteri"
              tokens={customerTokens}
              inputValue={customerInput}
              suggestions={customerSuggestions}
              onInputChange={setCustomerInput}
              onAddToken={(value) => addToken(value, setCustomerTokens, setCustomerInput)}
              onRemoveToken={(value) => removeToken(value, setCustomerTokens)}
            />
          </div>
          <div className="w-[200px] shrink-0">
            <MultiTokenFilterInput
              label="Acente"
              tokens={agencyTokens}
              inputValue={agencyInput}
              suggestions={agencySuggestions}
              onInputChange={setAgencyInput}
              onAddToken={(value) => addToken(value, setAgencyTokens, setAgencyInput)}
              onRemoveToken={(value) => removeToken(value, setAgencyTokens)}
            />
          </div>
          <div className="w-[200px] shrink-0">
            <MultiTokenFilterInput
              label="Misafir"
              tokens={guestTokens}
              inputValue={guestInput}
              suggestions={guestSuggestions}
              onInputChange={setGuestInput}
              onAddToken={(value) => addToken(value, setGuestTokens, setGuestInput)}
              onRemoveToken={(value) => removeToken(value, setGuestTokens)}
            />
          </div>
          <div className="w-[200px] shrink-0">
            <MultiTokenFilterInput
              label="Durum"
              tokens={statusTokens}
              inputValue={statusInput}
              suggestions={statusSuggestions}
              onInputChange={setStatusInput}
              onAddToken={(value) => addToken(value, setStatusTokens, setStatusInput)}
              onRemoveToken={(value) => removeToken(value, setStatusTokens)}
            />
          </div>

          {/* Clear Filters Button */}
          {(dateStart || dateEnd || voucherTokens.length > 0 || customerTokens.length > 0 || agencyTokens.length > 0 || guestTokens.length > 0 || statusTokens.length > 0) && (
            <button
              onClick={clearSejourFilters}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors shrink-0 mb-[2px]"
              title="Tüm Filtreleri Temizle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Action Buttons */}
          <button
            onClick={exportToExcel}
            className="h-10 px-4 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 flex items-center justify-center gap-2 font-medium shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          {canCreate(Module.SEJOUR) && (
            <Link
              href="/sejour/create"
              className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium shrink-0"
            >
              Yeni Sejour
            </Link>
          )}
        </div>
      </div>

      {/* Unified Stats Strip */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">DURUM:</span>
          <button onClick={() => setStatusFilter('all')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${statusFilter === 'all' ? 'bg-blue-500/20 border border-blue-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
            <span>TÜMÜ</span>
            <span className="font-bold">{totalCount}</span>
          </button>
          <button onClick={() => setStatusFilter('konfirme')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${statusFilter === 'konfirme' ? 'bg-green-500/20 border border-green-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
            <span>KONFİRME</span>
            <span className="font-bold">{sejoursKonfirmeCount}</span>
          </button>
          <button onClick={() => setStatusFilter('bekleyen')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${statusFilter === 'bekleyen' ? 'bg-yellow-500/20 border border-yellow-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
            <span>BEKLEYEN</span>
            <span className="font-bold">{sejoursBekleyenCount}</span>
          </button>
          <button onClick={() => setStatusFilter('iptal')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${statusFilter === 'iptal' ? 'bg-red-500/20 border border-red-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
            <span>İPTAL</span>
            <span className="font-bold">{sejoursIptalCount}</span>
          </button>
        </div>
      </div>

      `;
  content = content.substring(0, startIdx) + newHeader + content.substring(endIdx);
  fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
} else {
  console.log('Failed to find delimiters');
}
