const fs = require('fs');
let code = fs.readFileSync('src/app/permissions/roles/page.tsx', 'utf8');

// 1. Root container and Header Replacement
const headerRegex = /<div className="flex flex-col h-\[calc\(100vh-2rem\)\] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">[\s\S]*?(?=\{\/\* Stats Cards \*\/)/;
const newHeader = `<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <Shield size={24} />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Rol ve Yetki Yönetimi</h1>
              <p className="text-xs text-slate-400 mt-1">Rol seçip modüllere ait izinleri yönetin</p>
            </div>
          </div>
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {canEdit(Module.USERS) && (
              <button
                onClick={() => setShowAddRoleModal(true)}
                className="h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                + YENİ ROL
              </button>
            )}
          </div>
        </div>
        `;
code = code.replace(headerRegex, newHeader);

// 2. Stats Strip Replacement
const statsRegex = /\{\/\* Stats Cards \*\/\}[\s\S]*?(?=\{\/\* Success\/Error Messages \*\/)/;
const newStats = `{/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-slate-300">Durum:</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-400">
            TOPLAM ROL
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/10">{roles.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-400">
            TOPLAM MODÜL
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/10">{moduleList.length}</span>
          </div>
        </div>
        `;
code = code.replace(statsRegex, newStats);

// 3. Grid container & Roles list panel
code = code.replace(
  /<div className="xl:col-span-1 rounded-2xl border border-slate-200\/80 dark:border-gray-700 bg-white\/90 dark:bg-gray-900\/90 shadow-sm p-3">/g,
  '<div className="xl:col-span-1 rounded-2xl bg-[#0f172a]/40 backdrop-blur-md border border-white/10 flex flex-col min-h-0 p-3 shadow-sm">'
);
code = code.replace(
  /<h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Roller<\/h2>/g,
  '<h2 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Roller</h2>'
);
// Roles list item styles
code = code.replace(
  /\? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900\/20'/g,
  "? 'border-blue-500/30 bg-blue-500/10 text-blue-300'"
);
code = code.replace(
  /: 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800'/g,
  ": 'border-white/5 hover:bg-white/5 text-slate-300'"
);
// Role list item internal text color
code = code.replace(
  /<div className="font-medium text-sm text-slate-900 dark:text-white">/g,
  '<div className="font-medium text-sm">'
);

// 4. Modules table panel
const rightPanelRegex = /<div className="xl:col-span-3 rounded-2xl border border-slate-200\/80 dark:border-gray-700 bg-white\/90 dark:bg-gray-900\/90 shadow-sm p-3 md:p-4 flex flex-col min-h-0">/;
code = code.replace(rightPanelRegex, '<div className="xl:col-span-3 rounded-2xl bg-[#0f172a]/40 backdrop-blur-md border border-white/10 shadow-sm flex flex-col min-h-0">');

const tableHeaderRegex = /<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">[\s\S]*?(?=<div className="flex-1 overflow-auto pr-1">)/;
const newTableHeader = `<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-base font-medium text-white">
                  {selectedRole ? \`\${selectedRole.name} - Yetkileri\` : 'Rol seçin'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Modül izinlerini buradan yönetebilirsiniz.
                </p>
              </div>
              <div className="w-full md:w-72 h-10">
                <input
                  type="text"
                  value={moduleQuery}
                  onChange={(e) => setModuleQuery(e.target.value)}
                  placeholder="Modül ara..."
                  className="w-full h-full rounded-xl border border-white/10 bg-[#0f172a]/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            `;
code = code.replace(tableHeaderRegex, newTableHeader);

// 5. Table styles
code = code.replace(
  /<div className="flex-1 overflow-auto pr-1">/g,
  '<div className="flex-1 overflow-auto custom-scrollbar p-0">'
);
code = code.replace(
  /<table className="w-full border-collapse">/g,
  '<table className="min-w-full divide-y divide-white/10">'
);
code = code.replace(
  /<thead className="bg-slate-50 dark:bg-gray-800\/50 sticky top-0 z-10">/g,
  '<thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">'
);

code = code.replace(
  /<th className="border-b border-slate-200 dark:border-gray-700 py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">/g,
  '<th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">'
);
code = code.replace(
  /<th key=\{perm\.id\} className="border-b border-slate-200 dark:border-gray-700 py-3 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">/g,
  '<th key={perm.id} className="px-4 py-3 text-center text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10">'
);
code = code.replace(
  /<tbody className="divide-y divide-slate-100 dark:divide-gray-800">/g,
  '<tbody className="divide-y divide-white/5">'
);

// Table rows hover effect
code = code.replace(
  /<tr key=\{mod\.id\} className="hover:bg-slate-50 dark:hover:bg-gray-800\/50 transition-colors">/g,
  '<tr key={mod.id} className="hover:bg-blue-500/10 transition-colors group">'
);

// Cell styles
code = code.replace(
  /<td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-300 font-medium">/g,
  '<td className="px-4 py-3 text-sm font-medium text-white">'
);
code = code.replace(
  /<td key=\{perm\.id\} className="py-3 px-4 text-center">/g,
  '<td key={perm.id} className="px-4 py-3 text-center">'
);

// Bottom Actions Bar
const bottomBarRegex = /<div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700 flex justify-between items-center">/;
code = code.replace(
  bottomBarRegex,
  '<div className="mt-0 p-4 border-t border-white/10 flex justify-between items-center bg-[#0f172a]/60 shrink-0">'
);

// Checkbox styling (optional if we have a default checkbox class, but standard ones in tailwind look fine with accent-blue-500)

// Modal Cancel Buttons styling fix
code = code.replace(
  /className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200"/g,
  'className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors duration-200"'
);

// Final success/error notifications styling update
code = code.replace(
  /<div className="mb-2 p-2 bg-green-100 dark:bg-green-900\/20 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 rounded-md text-xs">/g,
  '<div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">'
);
code = code.replace(
  /<div className="mb-2 p-2 bg-red-100 dark:bg-red-900\/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md text-xs">/g,
  '<div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">'
);

fs.writeFileSync('src/app/permissions/roles/page.tsx', code, 'utf8');
