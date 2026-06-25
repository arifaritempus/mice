const fs = require('fs');

let code = fs.readFileSync('src/app/suppliers/service-types/page.tsx', 'utf8');

// 1. Imports
if (!code.includes('MultiTokenFilterInput')) {
  code = code.replace(
    "import PaginationControls from '@/components/PaginationControls';",
    "import PaginationControls from '@/components/PaginationControls';\nimport MultiTokenFilterInput from '@/components/MultiTokenFilterInput';"
  );
}

// 2. States
if (!code.includes('const [searchTokens, setSearchTokens] = useState<string[]>([]);')) {
  code = code.replace(
    "const [page, setPage] = useState(1);",
    "const [searchTerm, setSearchTerm] = useState('');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);\n  const [statsFilter, setStatsFilter] = useState('all');\n  const [page, setPage] = useState(1);"
  );
}

// 3. Search and Filter Logic
const filterLogic = `
  const searchAndFilterServiceTypes = (list: ServiceType[]) => {
    return list.filter(st => {
      // Stats filter
      if (statsFilter === 'active' && !st.is_active) return false;
      if (statsFilter === 'transfer' && st.code !== 'TRANSFER') return false;
      if (statsFilter === 'guide' && st.code !== 'GUIDE') return false;

      // Search term & tokens
      if (!searchTerm && (!searchTokens || searchTokens.length === 0)) return true;

      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return (
          st.name.toLowerCase().includes(lowerS) ||
          (st.code && st.code.toLowerCase().includes(lowerS)) ||
          (st.description && st.description.toLowerCase().includes(lowerS)) ||
          (st.notes && st.notes.toLowerCase().includes(lowerS))
        );
      };

      if (searchTerm && !matches(searchTerm)) return false;

      if (searchTokens && searchTokens.length > 0) {
        for (const t of searchTokens) {
          if (!matches(t)) return false;
        }
      }

      return true;
    });
  };
`;

if (!code.includes('searchAndFilterServiceTypes')) {
  code = code.replace(
    "const sortServiceTypes = (list: ServiceType[]) => {",
    filterLogic + "\n  const sortServiceTypes = (list: ServiceType[]) => {"
  );
}

code = code.replace(
  'const sortedServiceTypes = sortServiceTypes(serviceTypes);',
  'const filteredServiceTypes = searchAndFilterServiceTypes(serviceTypes);\n  const sortedServiceTypes = sortServiceTypes(filteredServiceTypes);'
);

code = code.replace(
  'useEffect(() => {\n    loadServiceTypes();\n  }, []);',
  'useEffect(() => {\n    loadServiceTypes();\n  }, []);\n\n  useEffect(() => {\n    setPage(1);\n  }, [searchTerm, searchTokens, statsFilter]);'
);

// 4. toggleStatus
const toggleStatusCode = `
  const handleToggleActive = async (serviceTypeId: string, currentStatus: boolean) => {
    try {
      await serviceTypesService.update(serviceTypeId, { is_active: !currentStatus } as any);
      await loadServiceTypes();
      setSuccess('Hizmet türü durumu güncellendi');
    } catch (err) {
      setError('Hizmet türü durumu güncellenirken hata oluştu');
    }
  };
`;
if (!code.includes('handleToggleActive')) {
  code = code.replace(
    'const loadServiceTypes = async () => {',
    toggleStatusCode + '\n  const loadServiceTypes = async () => {'
  );
}


// 5. Layout Rewrite
const layoutRegex = /<div className="flex flex-col h-\[calc\(100vh-2rem\)\] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">[\s\S]*?(?=\{\/\* Hizmet Türleri Listesi \*\/)/;

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
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Hizmet Kategori Yönetimi</h1>
              <p className="text-xs text-slate-400 mt-1">Transfer, rehber, otel ve diğer hizmet türlerini yönetin</p>
            </div>
          </div>
          
          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">GENEL ARAMA (TÜR, KOD, AÇIKLAMA...)</label>
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
              onClick={() => { setStatsFilter('all'); setSearchTerm(''); setSearchTokens([]); }} 
              className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all shrink-0" 
              title="Filtreleri Temizle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>

            {/* Actions Divider */}
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block"></div>

            {canCreate(Module.SUPPLIERS) && (
              <button onClick={() => setShowCreateModal(true)} className="h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0">
                + YENİ HİZMET TÜRÜ
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {success}
          </div>
        )}

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-slate-300">Durum:</span>
          </div>

          <button onClick={() => setStatsFilter('all')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${statsFilter === 'all' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            TÜMÜ
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${statsFilter === 'all' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10'}\`}>{serviceTypes.length}</span>
          </button>
          <button onClick={() => setStatsFilter('active')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${statsFilter === 'active' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            AKTİF
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${statsFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10'}\`}>{serviceTypes.filter(st => st.is_active).length}</span>
          </button>
          <button onClick={() => setStatsFilter('transfer')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${statsFilter === 'transfer' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            TRANSFER
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${statsFilter === 'transfer' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10'}\`}>{serviceTypes.filter(st => st.code === 'TRANSFER').length}</span>
          </button>
          <button onClick={() => setStatsFilter('guide')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${statsFilter === 'guide' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            REHBER
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${statsFilter === 'guide' ? 'bg-orange-500/20 text-orange-300' : 'bg-white/10'}\`}>{serviceTypes.filter(st => st.code === 'GUIDE').length}</span>
          </button>
        </div>

        `;

code = code.replace(layoutRegex, newLayout);


// 6. Rewrite List Rows
const oldRowRegex = /<div key=\{serviceType\.id\} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">[\s\S]*?(?=\{\/\* İşlemler \*\/)/g;

// Instead of global replace of a huge chunk, I will manually replace the exact string portions of the row.

// Row container
code = code.replace(
  /<div key=\{serviceType\.id\} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">/g,
  '<div key={serviceType.id} className="bg-[#0f172a]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:bg-blue-500/10 cursor-pointer transition-colors duration-200 group" onDoubleClick={() => { setEditingServiceType(serviceType); setShowEditModal(true); }}>'
);

// Inner wrapper padding
code = code.replace(
  /<div className="px-4 py-3">/g,
  '<div className="px-4 py-4">'
);

// Add Arrows
code = code.replace(
  /<div className="flex items-center justify-between">/g,
  `<div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 mr-3 border-r border-white/10 pr-3">
                      <button onClick={(e) => { e.stopPropagation(); moveServiceTypeUp(serviceType.id); }} className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors" title="Yukarı Taşı">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveServiceTypeDown(serviceType.id); }} className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors" title="Aşağı Taşı">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>`
);

// Blue circle index -> White text
code = code.replace(
  /<div className="w-6 h-6 bg-blue-100 dark:bg-blue-900\/30 rounded-full flex items-center justify-center">/g,
  '<div className="w-6 h-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">'
);
code = code.replace(
  /<span className="text-blue-600 dark:text-blue-400 text-xs font-bold">\{index \+ 1\}<\/span>/g,
  '<span className="text-slate-400 text-xs font-bold">{index + 1}</span>'
);

// Row texts to white/slate
code = code.replace(/text-gray-900 dark:text-white/g, 'text-white group-hover:text-blue-300');
code = code.replace(/text-gray-600 dark:text-gray-400/g, 'text-slate-400');
code = code.replace(/text-gray-500 dark:text-gray-400/g, 'text-slate-500');
code = code.replace(/text-gray-700 dark:text-gray-300/g, 'text-slate-300');


// Status badge to Button
const badgeRegex = /<span\s+className={`inline-flex px-2\.5 py-1 text-xs font-medium rounded-full border \${\s*serviceType\.is_active\s*\?\s*'bg-green-100 text-green-800 border-green-200 dark:bg-green-900\/30 dark:text-green-400 dark:border-green-800'\s*:\s*'bg-red-100 text-red-800 border-red-200 dark:bg-red-900\/30 dark:text-red-400 dark:border-red-800'\s*}\s*`}\s*>\s*\{serviceType\.is_active \? 'Aktif' : 'Pasif'\}\s*<\/span>/g;

const badgeNew = `<button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(serviceType.id, serviceType.is_active || false); }}
                        className={\`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity \${
                          serviceType.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }\`}
                        title="Durumu Değiştir"
                      >
                        {serviceType.is_active ? "Aktif" : "Pasif"}
                      </button>`;
code = code.replace(badgeRegex, badgeNew);


// Actions buttons (Edit/Delete)
code = code.replace(
  /className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1\.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900\/30 transition-colors duration-200"/g,
  'className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"'
);

code = code.replace(
  /className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1\.5 rounded hover:bg-red-50 dark:hover:bg-red-900\/30 transition-colors duration-200"/g,
  'className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"'
);

// Fix onClick propagation for Edit and Delete
code = code.replace(
  /onClick=\{\(\) => setEditingServiceType\(serviceType\)\}/g,
  'onClick={(e) => { e.stopPropagation(); setEditingServiceType(serviceType); setShowEditModal(true); }}'
);
code = code.replace(
  /onClick=\{\(\) => handleDelete\(serviceType\.id\)\}/g,
  'onClick={(e) => { e.stopPropagation(); handleDelete(serviceType.id); }}'
);

fs.writeFileSync('src/app/suppliers/service-types/page.tsx', code, 'utf8');
