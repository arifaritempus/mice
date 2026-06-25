const fs = require('fs');

let code = fs.readFileSync('src/app/suppliers/page.tsx', 'utf8');

// 1. Add Import
if (!code.includes('MultiTokenFilterInput')) {
  code = code.replace(
    'import PaginationControls from "@/components/PaginationControls";',
    'import PaginationControls from "@/components/PaginationControls";\nimport MultiTokenFilterInput from "@/components/MultiTokenFilterInput";'
  );
}

// 2. Add State
if (!code.includes('const [searchTokens, setSearchTokens] = useState<string[]>([]);')) {
  code = code.replace(
    'const [searchTerm, setSearchTerm] = useState(\'\');',
    'const [searchTerm, setSearchTerm] = useState(\'\');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);'
  );
}

// 3. Update searchSuppliers
const oldSearchFuncRegex = /const searchSuppliers = \([^\{]+\{[\s\S]*?\n  \};\n/;
const newSearchFunc = `const searchSuppliers = (suppliers: Supplier[], term: string, tokens: string[]) => {
    if (!term && (!tokens || tokens.length === 0)) return suppliers;
    
    return suppliers.filter(supplier => {
      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return supplier.name.toLowerCase().includes(lowerS) ||
               (supplier.title && supplier.title.toLowerCase().includes(lowerS)) ||
               (supplier.service_type && supplier.service_type.toLowerCase().includes(lowerS)) ||
               (supplier.contact_person && supplier.contact_person.toLowerCase().includes(lowerS)) ||
               (supplier.phone && supplier.phone.toLowerCase().includes(lowerS)) ||
               (supplier.email && supplier.email.toLowerCase().includes(lowerS)) ||
               (supplier.address && supplier.address.toLowerCase().includes(lowerS)) ||
               (supplier.tax_id && supplier.tax_id.toLowerCase().includes(lowerS)) ||
               (supplier.tax_office && supplier.tax_office.toLowerCase().includes(lowerS)) ||
               (supplier.notes && supplier.notes.toLowerCase().includes(lowerS));
      };

      if (term && !matches(term)) return false;

      if (tokens && tokens.length > 0) {
        for (const t of tokens) {
          if (!matches(t)) return false;
        }
      }

      return true;
    });
  };
`;
code = code.replace(oldSearchFuncRegex, newSearchFunc);

// 4. Update filteredSuppliers call
code = code.replace(
  'searchTerm\n    ),',
  'searchTerm,\n      searchTokens\n    ),'
);

// 5. Update useEffect dependencies
code = code.replace(
  '[searchTerm, filter, sortField, sortDirection]',
  '[searchTerm, searchTokens, filter, sortField, sortDirection]'
);

// 6. Rewrite Layout (Header & Stats)
const layoutRegex = /<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar font-sans text-white">[\s\S]*?(?=\{\/\* Tedarikçiler Tablosu \*\/)/;

const newLayout = `<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Tedarikçi Yönetimi</h1>
              <p className="text-xs text-slate-400 mt-1">Transfer, rehber, otel ve diğer hizmet tedarikçilerini yönetin</p>
            </div>
          </div>
          
          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">GENEL ARAMA (TEDARİKÇİ, UNVAN, HİZMET...)</label>
              <div className="h-10">
                <MultiTokenFilterInput
                  label=""
                  placeholder="Yaz, Enter ile ekle"
                  inputValue={searchTerm}
                  onInputChange={setSearchTerm}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchTerm('');
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter(st => st !== t));
                  }}
                />
              </div>
            </div>

            {/* Trash Button */}
            <button 
              onClick={() => { setFilter('all'); setSearchTerm(''); setSearchTokens([]); }} 
              className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all shrink-0" 
              title="Filtreleri Temizle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>

            {/* Actions Divider */}
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block"></div>

            {/* Actions */}
            <label className="h-10 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {importing ? 'YÜKLENİYOR...' : 'EXCEL YÜKLE'}
              <input type="file" accept=".xlsx,.xls" onChange={handleFileImport} disabled={importing} className="hidden" />
            </label>

            <button onClick={exportSuppliersToExcel} disabled={exporting} className="h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" /></svg>
              {exporting ? 'İNDİRİLİYOR...' : 'EXCEL İNDİR'}
            </button>

            {canCreate(Module.SUPPLIERS) && (
              <button onClick={() => setShowCreateModal(true)} className="h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0">
                <Plus size={16} /> YENİ TEDARİKÇİ
              </button>
            )}
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-slate-300">Durum:</span>
          </div>

          <button onClick={() => setFilter('all')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${filter === 'all' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            TÜMÜ
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${filter === 'all' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10'}\`}>{stats.total}</span>
          </button>
          <button onClick={() => setFilter('active')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${filter === 'active' ? 'bg-teal-500/20 border border-teal-500/30 text-teal-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            AKTİF
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${filter === 'active' ? 'bg-teal-500/20 text-teal-300' : 'bg-white/10'}\`}>{stats.active}</span>
          </button>
          <button onClick={() => setFilter('transfer')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${filter === 'transfer' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            TRANSFER
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${filter === 'transfer' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10'}\`}>{stats.transfer}</span>
          </button>
          <button onClick={() => setFilter('guide')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${filter === 'guide' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            REHBER
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${filter === 'guide' ? 'bg-orange-500/20 text-orange-300' : 'bg-white/10'}\`}>{stats.guide}</span>
          </button>
          <button onClick={() => setFilter('hotel')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${filter === 'hotel' ? 'bg-pink-500/20 border border-pink-500/30 text-pink-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            OTEL
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${filter === 'hotel' ? 'bg-pink-500/20 text-pink-300' : 'bg-white/10'}\`}>{stats.hotel}</span>
          </button>
        </div>

        `;

code = code.replace(layoutRegex, newLayout);

fs.writeFileSync('src/app/suppliers/page.tsx', code, 'utf8');
