const fs = require('fs');

let content = fs.readFileSync('src/app/accounting/cash-flow/page.tsx', 'utf8');

// 1. Replace Imports
content = content.replace(
  "import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';",
  "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
);

// 2. Set default viewMode to custom
content = content.replace(
  "const [viewMode, setViewMode] = useState<ViewMode>('monthly');",
  "const [viewMode, setViewMode] = useState<ViewMode>('custom');"
);

// 3. Set default dates for dateStart and dateEnd to the current month (from 1st to end)
content = content.replace(
  "const [dateStart, setDateStart] = useState('');\n  const [dateEnd, setDateEnd] = useState('');",
  "const today = new Date();\n  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);\n  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);\n  const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;\n  const [dateStart, setDateStart] = useState(toStr(firstDay));\n  const [dateEnd, setDateEnd] = useState(toStr(lastDay));"
);

// 4. Remove useEffect that overrides dates for viewMode
const effectStart = '  // ViewMode değiştiğinde tarih aralığını hesaplama\n  useEffect(() => {\n    if (viewMode === \'custom\') {\n      // Özel modda dateStart ve dateEnd kullanıcı tarafından belirlenir\n      return;\n    }';
const effectEnd = '    setDateStart(toInputValue(start));\n    setDateEnd(toInputValue(end));\n  }, [viewMode, currentDate]);\n';
const effectStartIdx = content.indexOf(effectStart);
const effectEndIdx = content.indexOf(effectEnd) + effectEnd.length;
if (effectStartIdx !== -1) {
  content = content.substring(0, effectStartIdx) + content.substring(effectEndIdx);
}

// 5. Add searchTokens to state
content = content.replace(
  "const [searchTerm, setSearchTerm] = useState('');",
  "const [searchTerm, setSearchTerm] = useState('');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);"
);

// 6. Update search filtering logic to use tokens
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

// 7. Update Header layout to exactly match V3
const headerStart = '{/* Right Side */}';
const headerEnd = '{/* Main Content Area */}';
const headerStartIdx = content.indexOf(headerStart);
const headerEndIdx = content.indexOf(headerEnd);

if (headerStartIdx !== -1) {
  const newHeader = `{/* Right Side */}
        <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
          
          {/* Dates */}
          <div className="w-[240px] shrink-0">
            <ResponsiveDateRangeField
              label="Tarih Aralığı"
              startValue={dateStart}
              endValue={dateEnd}
              onStartChange={setDateStart}
              onEndChange={setDateEnd}
            />
          </div>

          {/* Search */}
          <div className="flex-[2] min-w-[300px]">
            <MultiTokenFilterInput
              label="Genel Arama (Proje, Firma vb.)"
              tokens={searchTokens}
              inputValue={searchTerm}
              suggestions={[]}
              onInputChange={setSearchTerm}
              onAddToken={(val) => {
                const trimmed = val.trim();
                if (trimmed && !searchTokens.includes(trimmed)) {
                  setSearchTokens(prev => [...prev, trimmed]);
                  setSearchTerm('');
                }
              }}
              onRemoveToken={(val) => setSearchTokens(prev => prev.filter(t => t !== val))}
            />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchTokens([]);
                setDateStart(toStr(firstDay));
                setDateEnd(toStr(lastDay));
              }}
              className="w-10 h-10 inline-flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              title="Temizle"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={exportCashFlowExcel}
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase"
            >
              <Download size={14} /> EXCEL İNDİR
            </button>
          </div>
        </div>
      </div>

      `;
  
  content = content.slice(0, headerStartIdx) + newHeader + content.slice(headerEndIdx);
}

// 8. Remove internal "Takvim Navigasyonu" since we now use ResponsiveDateRangeField strictly
const navStart = '{/* Takvim Navigasyonu */}';
const navEnd = '{/* Stats Section */}';
const navStartIdx = content.indexOf(navStart);
const navEndIdx = content.indexOf(navEnd);
if (navStartIdx !== -1 && navEndIdx !== -1) {
  content = content.substring(0, navStartIdx) + content.substring(navEndIdx);
}

fs.writeFileSync('src/app/accounting/cash-flow/page.tsx', content, 'utf8');
console.log("Applied V3 filter components and removed redundant calendar navigation");
