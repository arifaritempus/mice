const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// 1. Base Layout
content = content.replace(
  '<div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 overflow-hidden">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
);
content = content.replace(
  '<div className="w-full min-w-0 flex flex-col flex-1 min-h-0">',
  '<div className="w-full min-w-0 flex-1 flex flex-col">'
);

// 2. The Header to Data Table replacement
const startStr = '{/* Header */}';
const endStr = '{/* Data Table */}';
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
}

// 3. The Table Header and Body wrappers
content = content.replace(
  '<div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden transition-colors duration-200">',
  '<div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden">'
);
content = content.replace(
  '<thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-20 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">',
  '<thead className="bg-[#1e293b]/95 sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-white/10">'
);
content = content.replace(
  '<tbody className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">',
  '<tbody className="divide-y divide-white/5">'
);

// Th classes
content = content.replace(
  /className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"/g,
  'className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 border-b border-white/10"'
);
content = content.replace(
  /className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"/g,
  'className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10"'
);

// Tr classes
content = content.replace(
  /<tr key=\{sejour\.id\} className="hover:bg-gray-50 dark:hover:bg-gray-700">/g,
  '<tr key={sejour.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0" onDoubleClick={() => router.push(`/sejour/${sejour.id}`)}>'
);

// Td classes
content = content.replace(
  /className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white"/g,
  'className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-white"'
);
content = content.replace(
  /className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300"/g,
  'className="px-2.5 py-2.5 whitespace-nowrap text-xs text-slate-200"'
);

// 4. Router logic
if (!content.includes("import { useRouter } from 'next/navigation';")) {
  content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { useRouter } from 'next/navigation';");
}
if (!content.includes('const router = useRouter();')) {
  content = content.replace('export default function SejourPage() {\n', 'export default function SejourPage() {\n  const router = useRouter();\n');
}

// 5. Dates logic
if (!content.includes('const getDayNameShort =')) {
  const dayNameFunc = `
  const getDayNameShort = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  };
`;
  content = content.replace('export default function SejourPage() {\n  const router = useRouter();', 'export default function SejourPage() {\n  const router = useRouter();\n' + dayNameFunc);
}
content = content.replace(
  /\{formatDate\(sejour\.checkInDate\)\}/g,
  '{formatDate(sejour.checkInDate)} <span className="text-slate-500 font-medium ml-1">{getDayNameShort(sejour.checkInDate)}</span>'
);
content = content.replace(
  /\{formatDate\(sejour\.checkOutDate\)\}/g,
  '{formatDate(sejour.checkOutDate)} <span className="text-slate-500 font-medium ml-1">{getDayNameShort(sejour.checkOutDate)}</span>'
);

// 6. Currency logic
content = content.replace(/<div>TRY: \{formatNumber\(colTRY\)\}<\/div>/g, '{colTRY !== 0 && <div>TRY: {formatNumber(colTRY)}</div>}');
content = content.replace(/<div>EUR: \{formatNumber\(colEUR\)\}<\/div>/g, '{colEUR !== 0 && <div>EUR: {formatNumber(colEUR)}</div>}');
content = content.replace(/<div>USD: \{formatNumber\(colUSD\)\}<\/div>/g, '{colUSD !== 0 && <div>USD: {formatNumber(colUSD)}</div>}');
content = content.replace(/<div>GBP: \{formatNumber\(colGBP\)\}<\/div>/g, '{colGBP !== 0 && <div>GBP: {formatNumber(colGBP)}</div>}');

content = content.replace(/<div>TRY: \{formatNumber\(balTRY\)\}<\/div>/g, '{balTRY !== 0 && <div>TRY: {formatNumber(balTRY)}</div>}');
content = content.replace(/<div>EUR: \{formatNumber\(balEUR\)\}<\/div>/g, '{balEUR !== 0 && <div>EUR: {formatNumber(balEUR)}</div>}');
content = content.replace(/<div>USD: \{formatNumber\(balUSD\)\}<\/div>/g, '{balUSD !== 0 && <div>USD: {formatNumber(balUSD)}</div>}');
content = content.replace(/<div>GBP: \{formatNumber\(balGBP\)\}<\/div>/g, '{balGBP !== 0 && <div>GBP: {formatNumber(balGBP)}</div>}');

// 7. Oda logic
content = content.replace(
  /Oda \{room\.roomNumber \|\| index \+ 1\}/g,
  '{String(room.roomNumber || "").toLowerCase().includes("oda") ? room.roomNumber : `Oda ${room.roomNumber || index + 1}`}'
);

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
