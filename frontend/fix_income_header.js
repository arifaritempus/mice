const fs = require('fs');

let file = 'src/app/accounting/invoices/income/pending/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const exportFunc = `
  const exportToExcel = () => {
    // Excel export logic will be added here
    console.log('Exporting to excel', filteredItems);
    alert('Excel aktarımı yakında eklenecektir.');
  };
`;

// Insert export func after loadItems
content = content.replace('const loadItems = async () => {', exportFunc + '\n  const loadItems = async () => {');

// Rewrite header
const headerRegex = /<div className="flex flex-col md:flex-row md:items-start justify-start gap-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newHeader = `<div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight glow-text uppercase">
              BEKLEYEN GELİR FATURALARI
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Fatura Kesilmeyi Bekleyen Satış Kalemleri
            </p>
          </div>
        </div>

        {/* Aksiyon Butonu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={selectedItems.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Fatura Oluştur {selectedItems.length > 0 && \`(\${selectedItems.length})\`}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 bg-[#0f172a]/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-sm">
        <div className="w-48 shrink-0">
          <DateRangeFieldAccounting
            label="FATURA TARİHİ"
            startValue={dateRange.start}
            endValue={dateRange.end}
            onStartChange={(value) => setDateRange((prev) => ({ ...prev, start: value }))}
            onEndChange={(value) => setDateRange((prev) => ({ ...prev, end: value }))}
          />
        </div>
        <div className="flex-[2] min-w-[300px]">
          <MultiTokenFilterInput
            label="GENEL ARAMA (VOUCHER, FİRMA, ACENTE, OTEL, KATEGORİ VB.)"
            tokens={globalTokens}
            inputValue={globalInput}
            suggestions={[]}
            onInputChange={setGlobalInput}
            onAddToken={(t) => {
              const trimmed = t.trim();
              if (trimmed && !globalTokens.includes(trimmed)) {
                setGlobalTokens(prev => [...prev, trimmed]);
                setGlobalInput('');
              }
            }}
            onRemoveToken={(t) => setGlobalTokens(prev => prev.filter(v => v !== t))}
          />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setGlobalTokens([]);
              setGlobalInput('');
            }}
            className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
            title="Filtreleri Temizle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button
            onClick={exportToExcel}
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Excel İndir
          </button>
        </div>
      </div>`;

content = content.replace(headerRegex, newHeader);

fs.writeFileSync(file, content, 'utf8');
