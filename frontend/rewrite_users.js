const fs = require('fs');
let code = fs.readFileSync('src/app/users/page.tsx', 'utf8');

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
  const searchAndFilterUsers = (list: User[]) => {
    return list.filter(u => {
      // Stats filter
      if (statsFilter === 'active' && !u.is_active) return false;
      if (statsFilter === 'passive' && u.is_active) return false;

      // Search term & tokens
      if (!searchTerm && (!searchTokens || searchTokens.length === 0)) return true;

      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return (
          (u.first_name || '').toLowerCase().includes(lowerS) ||
          (u.last_name || '').toLowerCase().includes(lowerS) ||
          (u.full_name || '').toLowerCase().includes(lowerS) ||
          (u.email || '').toLowerCase().includes(lowerS) ||
          (u.role || '').toLowerCase().includes(lowerS)
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

if (!code.includes('searchAndFilterUsers')) {
  code = code.replace(
    "const loadUsers = async () => {",
    filterLogic + "\n  const loadUsers = async () => {"
  );
}

// 4. Reset page when filters change
if (!code.includes('statsFilter])')) {
  code = code.replace(
    "loadUsers();\n  }, []);",
    "loadUsers();\n  }, []);\n\n  useEffect(() => {\n    setPage(1);\n  }, [searchTerm, searchTokens, statsFilter]);"
  );
}

// 5. Update paginatedUsers to use searchAndFilterUsers
const paginatedUsersRegex = /const paginatedUsers = paginateItems\(\s*users,\s*page,\s*pageSize\s*\);/;
code = code.replace(
  paginatedUsersRegex,
  "const filteredUsers = searchAndFilterUsers(users);\n  const paginatedUsers = paginateItems(filteredUsers, page, pageSize);"
);

// 6. Header Layout Replacement
const layoutRegex = /<div className="flex items-center justify-between mb-6">[\s\S]*?(?=\{\/\* İstatistikler \*\/)/;

const newHeader = `<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Kullanıcı Yönetimi</h1>
              <p className="text-xs text-slate-400 mt-1">Sistem kullanıcılarını ve rollerini yönetin</p>
            </div>
          </div>
          
          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">GENEL ARAMA (İSİM, E-POSTA, ROL...)</label>
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

            <button onClick={handleExportExcel} disabled={exporting} className="h-10 bg-[#0f172a]/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 py-2 px-4 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0">
              {exporting ? (
                <><span className="animate-spin">⏳</span> İNDİRİLİYOR...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> EXCEL İNDİR</>
              )}
            </button>
            <label className="h-10 bg-[#0f172a]/40 text-orange-400 border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/30 py-2 px-4 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 cursor-pointer">
              {importing ? (
                <><span className="animate-spin">⏳</span> YÜKLENİYOR...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> EXCEL YÜKLE</>
              )}
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" disabled={importing} />
            </label>

            {canCreate(Module.USERS) && (
              <button onClick={() => {
                const defaultRole = roles && roles.length > 0 ? roles.find(r => r.is_active)?.id || 'user' : 'user';
                setNewUser(prev => ({ ...prev, role: defaultRole }));
                setShowCreateModal(true);
              }} className="h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0">
                + YENİ KULLANICI
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
`;

code = code.replace(layoutRegex, newHeader);


// 7. Stats Replacement
const statsRegex = /\{\/\* İstatistikler \*\/\}[\s\S]*?(?=\{\/\* Users Table \*\/)/;
const unifiedStats = `{/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-slate-300">Durum:</span>
          </div>

          <button onClick={() => setStatsFilter('all')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${statsFilter === 'all' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            TÜMÜ
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${statsFilter === 'all' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10'}\`}>{users.length}</span>
          </button>
          <button onClick={() => setStatsFilter('active')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${statsFilter === 'active' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            AKTİF
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${statsFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10'}\`}>{users.filter(u => u.is_active).length}</span>
          </button>
          <button onClick={() => setStatsFilter('passive')} className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 \${statsFilter === 'passive' ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}\`}>
            PASİF
            <span className={\`px-1.5 py-0.5 rounded-md text-[9px] \${statsFilter === 'passive' ? 'bg-red-500/20 text-red-300' : 'bg-white/10'}\`}>{users.filter(u => !u.is_active).length}</span>
          </button>
        </div>

        `;

code = code.replace(statsRegex, unifiedStats);

// 8. Row Replacement (Double Click)
code = code.replace(
  /<tr key=\{user\.id\} className="hover:bg-white\/5 transition-colors group">/g,
  '<tr key={user.id} className="hover:bg-blue-500/10 cursor-pointer transition-colors group" onDoubleClick={() => { setEditUser(user); setShowEditModal(true); }}>'
);


// 9. Active/Passive Badge Clickable
const badgeRegex = /<span className={`inline-flex px-2\.5 py-1 text-\[11px\] font-semibold rounded-full border \$\{user\.is_active \? 'bg-teal-500\/10 text-teal-400 border-teal-500\/20' : 'bg-red-500\/10 text-red-400 border-red-500\/20'\}`}>[\s\S]*?<\/span>/;
const badgeNew = `<button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(user.id, user.is_active || false); }}
                        className={\`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity \${
                          user.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }\`}
                        title="Durumu Değiştir"
                      >
                        {user.is_active ? "Aktif" : "Pasif"}
                      </button>`;
code = code.replace(badgeRegex, badgeNew);

// 10. Table Action Buttons Stop Propagation
code = code.replace(
  /onClick=\{\(\) => openEditModal\(user\)\}/g,
  'onClick={(e) => { e.stopPropagation(); openEditModal(user); }}'
);
code = code.replace(
  /onClick=\{\(\) => setUserToDelete\(user\.id\)\}/g,
  'onClick={(e) => { e.stopPropagation(); setUserToDelete(user.id); }}'
);
// Replace the old active toggle button which was an icon, we can just remove it since it's on the badge now. Or we can just let it exist. But we must stop propagation.
code = code.replace(
  /onClick=\{\(\) => handleToggleActive\(user\.id, user\.is_active\)\}/g,
  'onClick={(e) => { e.stopPropagation(); handleToggleActive(user.id, user.is_active); }}'
);

fs.writeFileSync('src/app/users/page.tsx', code, 'utf8');
