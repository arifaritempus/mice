const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/payments/page.tsx', 'utf8');

// 1. Add import for MultiTokenFilterInput
if (!content.includes('import MultiTokenFilterInput')) {
  content = content.replace(
    "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';",
    "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
  );
}

// 2. Replace state variables
content = content.replace(
  `  // Arama ve Filtreleme State'leri
  const [companyFilter, setCompanyFilter] = useState('')
  const [agencyFilter, setAgencyFilter] = useState('')
  const [pnrFilter, setPnrFilter] = useState('')`,
  `  // Arama ve Filtreleme State'leri
  const [voucherTokens, setVoucherTokens] = useState<string[]>([])
  const [voucherInput, setVoucherInput] = useState('')
  const [voucherSuggestions, setVoucherSuggestions] = useState<string[]>([])

  const addToken = useCallback((value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, inputSetter: React.Dispatch<React.SetStateAction<string>>) => {
    const trimmed = value.trim()
    if (trimmed && !voucherTokens.includes(trimmed)) {
      setter(prev => [...prev, trimmed])
      inputSetter('')
    }
  }, [voucherTokens])

  const removeToken = useCallback((value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter(t => t !== value))
  }, [])`
);

// 3. Update useEffect
content = content.replace(
  `useEffect(() => {
    setPage(1)
  }, [companyFilter, agencyFilter, pnrFilter, departureDateRange, sortBy])`,
  `useEffect(() => {
    setPage(1)
  }, [voucherTokens, departureDateRange, sortBy])`
);

// 4. Update filteredTickets
const filterOld = `      // Alan bazlı metin filtreleri
      if (companyFilter.trim()) {
        const target = (ticket.company_name || '').toLowerCase()
        if (!target.includes(companyFilter.trim().toLowerCase())) return false
      }
      if (agencyFilter.trim()) {
        const target = (ticket.agent || '').toLowerCase()
        if (!target.includes(agencyFilter.trim().toLowerCase())) return false
      }
      if (pnrFilter.trim()) {
        const target = (ticket.pnr || '').toLowerCase()
        if (!target.includes(pnrFilter.trim().toLowerCase())) return false
      }`;

const filterNew = `      // Genel Arama kontrolü
      if (voucherTokens.length > 0) {
        const searchStr = [
          ticket.voucher_no,
          ticket.pnr,
          ticket.company_name,
          ticket.agent,
          ticket.airline
        ].join(' ').toLowerCase()
        
        const allTokensMatch = voucherTokens.every(token => 
          searchStr.includes(token.toLowerCase())
        )
        if (!allTokensMatch) return false
      }`;

content = content.replace(filterOld, filterNew);

// Update useMemo dependencies
content = content.replace(
  `[confirmedTickets, companyFilter, agencyFilter, pnrFilter, departureDateRange.startDate, departureDateRange.endDate, paymentPlans, paymentRecords, sortBy, toCalendarYmd]`,
  `[confirmedTickets, voucherTokens, departureDateRange.startDate, departureDateRange.endDate, paymentPlans, paymentRecords, sortBy, toCalendarYmd]`
);

content = content.replace(
  `useEffect(() => {
    setPage(1)
  }, [companyFilter, agencyFilter, pnrFilter, departureDateRange.startDate, departureDateRange.endDate, sortBy])`,
  `useEffect(() => {
    setPage(1)
  }, [voucherTokens, departureDateRange.startDate, departureDateRange.endDate, sortBy])`
);

// 5. Replace header block (lines 860-993 approx)
const oldHeaderBlockRegex = /{\/\* Modern Header \*\/}[\s\S]*?(?={\/\* Bilet Listesi \*\/})/;

const newHeaderBlock = `{/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">Bilet Ödemeleri</h1>
            <p className="text-xs text-slate-400 mt-1">Konfirme biletlerin ödeme planlarını ve kayıtlarını yönetin</p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Uçuş Tarihi"
                startValue={departureDateRange.startDate}
                endValue={departureDateRange.endDate}
                onStartChange={(v) => setDepartureDateRange(prev => ({ ...prev, startDate: v }))}
                onEndChange={(v) => setDepartureDateRange(prev => ({ ...prev, endDate: v }))}
                onApply={() => setPage(1)}
              />
            </div>
            
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Voucher, PNR, Firma vb.)"
                tokens={voucherTokens}
                inputValue={voucherInput}
                suggestions={voucherSuggestions}
                onInputChange={setVoucherInput}
                onAddToken={(value) => addToken(value, setVoucherTokens, setVoucherInput)}
                onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
              />
            </div>

            {/* Clear Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setVoucherTokens([])
                  setVoucherInput('')
                  setDepartureDateRange({ startDate: '', endDate: '' })
                  setSortBy('flight')
                  setPage(1)
                  setFilterKey(k => k + 1)
                }}
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
                type="button"
                onClick={exportPaymentsExcel}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
                title="Excel İndir"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel İndir
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">SIRALAMA / FİLTRE:</span>
            <button onClick={() => setSortBy('flight')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${sortBy === 'flight' ? 'bg-blue-500/20 border border-blue-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>UÇUŞ TARİHİ</span>
            </button>
            <button onClick={() => setSortBy('payment')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${sortBy === 'payment' ? 'bg-emerald-500/20 border border-emerald-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>ÖDEME TARİHİ</span>
            </button>
            <button onClick={() => setSortBy('balance')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${sortBy === 'balance' ? 'bg-orange-500/20 border border-orange-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>BAKİYESİ OLAN</span>
            </button>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4 text-slate-400">
            <span className="font-medium text-white">{filteredTickets.length} / {confirmedTickets.length}</span> bilet gösteriliyor
          </div>
        </div>

        `;

content = content.replace(oldHeaderBlockRegex, newHeaderBlock);

// Replace wrapper class
content = content.replace(
  '<div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 overflow-hidden">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
);

// 6. Replace Card UI Elements
// Card Wrapper
content = content.replace(
  /className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 mb-2"/g,
  'className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 mb-4 group"'
);

// Card Header Gradient
content = content.replace(
  /className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900\/20 dark:to-indigo-900\/20 p-2 border-b border-gray-200 dark:border-gray-600"/g,
  'className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-3 border-b border-white/10"'
);

// Bilet Başlığı Texts
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white');
content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-slate-400');

// Card Stats Background
content = content.replace(
  /className="p-3 bg-gray-50 dark:bg-gray-700\/50"/g,
  'className="p-4 bg-[#0f172a]/40 border-b border-white/5"'
);

// Inner Payment Plan Area
content = content.replace(
  /className="px-3 py-2 bg-blue-50 dark:bg-blue-900\/20 border-t border-blue-200 dark:border-blue-800"/g,
  'className="px-4 py-3 bg-blue-500/5 border-t border-white/5"'
);

// Installment Rows
content = content.replace(
  /className="flex items-center justify-between bg-white dark:bg-gray-700 rounded px-2 py-1\.5 border border-blue-200 dark:border-blue-800"/g,
  'className="flex items-center justify-between bg-white/5 rounded px-3 py-2 border border-white/5 hover:bg-white/10 transition-colors"'
);

// Payment History Rows
content = content.replace(
  /className="flex items-center justify-between bg-white dark:bg-gray-700 rounded px-2 py-1\.5 border border-green-200 dark:border-green-800"/g,
  'className="flex items-center justify-between bg-white/5 rounded px-3 py-2 border border-white/5 hover:bg-white/10 transition-colors"'
);

// Installment Labels (Taksit/Ödeme)
content = content.replace(
  /className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs font-medium px-2 py-0\.5 rounded-full"/g,
  'className="bg-blue-500/20 text-blue-300 text-[11px] font-medium px-2 py-1 rounded-full"'
);

content = content.replace(
  /className="bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 text-xs font-medium px-2 py-0\.5 rounded-full"/g,
  'className="bg-emerald-500/20 text-emerald-300 text-[11px] font-medium px-2 py-1 rounded-full"'
);

// Status Labels
content = content.replace(
  /'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'/g,
  "'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'"
);
content = content.replace(
  /'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'/g,
  "'bg-orange-500/20 text-orange-400 border border-orange-500/20'"
);
content = content.replace(
  /'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'/g,
  "'bg-blue-500/20 text-blue-400 border border-blue-500/20'"
);

fs.writeFileSync('src/app/tickets/payments/page.tsx', content, 'utf8');

console.log("Ticket Payments page modernized successfully.");
