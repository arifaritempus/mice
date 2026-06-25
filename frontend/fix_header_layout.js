const fs = require('fs');
let file = 'src/app/accounting/invoices/income/pending/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add lucide-react imports if missing
if (!content.includes('lucide-react')) {
  content = content.replace(
    "import { DEFAULT_PAGE_SIZE } from '@/types/pagination';",
    "import { DEFAULT_PAGE_SIZE } from '@/types/pagination';\nimport { RotateCcw, Download } from 'lucide-react';"
  );
}

// Replace the old header blocks (which includes the two rows)
const regex = /<div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newHeader = `<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 shrink-0">
        <div className="shrink-0 mr-4">
          <h1 className="text-2xl font-light tracking-wide text-white glow-text uppercase">Bekleyen Gelir Faturaları</h1>
          <p className="text-xs text-slate-400 mt-1">Fatura Kesilmeyi Bekleyen Satış Kalemleri</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          <div className="w-48 shrink-0">
            <DateRangeFieldAccounting
              label="FATURA TARİHİ"
              startValue={dateRange.start}
              endValue={dateRange.end}
              onStartChange={(value) => setDateRange((prev) => ({ ...prev, start: value }))}
              onEndChange={(value) => setDateRange((prev) => ({ ...prev, end: value }))}
            />
          </div>
          <div className="flex-[2] min-w-[300px] xl:max-w-[400px]">
            <MultiTokenFilterInput
              label="GENEL ARAMA (VOUCHER, FİRMA, ACENTE, OTEL, VB.)"
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
              <RotateCcw size={14} />
            </button>
            <button
              onClick={exportToExcel}
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase"
            >
              <Download size={14} /> Excel İndir
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={selectedItems.length === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase disabled:opacity-50 disabled:pointer-events-none"
            >
              Fatura Oluştur {selectedItems.length > 0 && \`(\${selectedItems.length})\`}
            </button>
          </div>
        </div>
      </div>`;

content = content.replace(regex, newHeader);
fs.writeFileSync(file, content, 'utf8');
