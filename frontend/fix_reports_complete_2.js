const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Fix main wrappers
code = code.replace(
  '<div className="flex-1 p-4 lg:p-8 space-y-6 max-w-[1920px] mx-auto w-full">',
  '<div className="flex-1 p-4 lg:p-8 space-y-6 max-w-[1920px] mx-auto w-full flex flex-col min-h-0">'
);
code = code.replace(
  '<div className="w-full min-w-0 flex-1 flex flex-col">',
  '<div className="w-full min-w-0 min-h-0 flex-1 flex flex-col">'
);

// 2. Extract filters
const presetsStr = '{/* Presets */}';
const tableAreaStr = '{/* Table Area */}';
const presetsIdx = code.indexOf(presetsStr);
const tableAreaIdx = code.indexOf(tableAreaStr);

let filtersBlock = '';
if (presetsIdx !== -1 && tableAreaIdx !== -1) {
  const block = code.substring(presetsIdx, tableAreaIdx);
  const buttonsEndIdx = block.lastIndexOf('</div>\n            </div>\n          </div>');
  filtersBlock = block.substring(0, buttonsEndIdx);
  
  // Cleanup CSS of filters
  filtersBlock = filtersBlock.replace(/flex-\[1\.5\] min-w-\[140px\]/g, 'flex-[2] min-w-[300px]');
  filtersBlock = filtersBlock.replace(/flex-\[2\] min-w-\[300px\] max-w-lg/g, 'flex-1 min-w-[300px]');
  filtersBlock = filtersBlock.replace(/border-l border-slate-200 dark:border-slate-700/g, 'border-l border-white/10');
  filtersBlock = filtersBlock.replace(/border-r border-slate-200 dark:border-slate-700/g, 'border-r border-white/10');
  filtersBlock = filtersBlock.replace(/bg-blue-600 hover:bg-blue-700 text-white font-black/g, 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30');
  filtersBlock = filtersBlock.replace(/bg-emerald-600 hover:bg-emerald-700 text-white font-black/g, 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30');
  filtersBlock = filtersBlock.replace(/p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100/g, 'p-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10');
  filtersBlock = filtersBlock.replace(/bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/g, 'bg-[#0f172a]/60 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50');
  
  // Cut it from controls bar
  code = code.substring(0, presetsIdx) + '\n            </div>\n          </div>\n\n          ' + code.substring(tableAreaIdx);
}

// 3. Fix Header Section
const headerRegex = /\{\/\* Header Section[\s\S]*?<div className="space-y-0\.5">[\s\S]*?<\/div>\n\s*<\/div>/;
const newHeaderBlock = `{/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6 shrink-0">
          <div className="flex items-center gap-4 mt-2 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Rapor Merkezi</h1>
              <p className="text-xs text-slate-400 mt-1">Sistem verilerinizi analiz edin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-3 flex-1">
            ${filtersBlock}
          </div>
        </div>`;

code = code.replace(headerRegex, newHeaderBlock);

// 4. Fix Categories V3 Style
code = code.replace(/bg-white dark:bg-slate-900\/50 rounded-3xl border border-slate-200 dark:border-slate-800/g, 'bg-[#0f172a]/40 border border-white/10 rounded-2xl');
code = code.replace(/bg-slate-50 dark:bg-slate-800\/40 border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300/g, 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300');
code = code.replace(/bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600\/20/g, 'bg-blue-500/20 border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]');

// 5. Fix Content Container V3 Style
code = code.replace(
  '<div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[600px]">',
  '<div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl flex flex-col flex-1 min-h-0 mt-6 shadow-2xl relative">'
);

code = code.replace(
  '<div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">',
  '<div className="sticky top-[-24px] sm:top-[-32px] z-30 px-6 py-4 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-xl rounded-t-2xl shadow-lg">'
);

code = code.replace(
  '<div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">',
  '<div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]">'
);

code = code.replace(
  '<h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight whitespace-nowrap">',
  '<h3 className="text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">'
);

code = code.replace(
  '<div className="flex items-center gap-2 shrink-0 border-r border-slate-200 dark:border-slate-700 pr-4 h-10">',
  '<div className="flex items-center gap-2 shrink-0 h-10">'
);

// 6. Fix table wrapper scroll
code = code.replace(
  '<div className="w-full relative rounded-b-2xl overflow-auto custom-scrollbar flex-1">',
  '<div className="w-full relative rounded-b-2xl overflow-auto custom-scrollbar flex-1 min-h-0">'
);

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed reports complete 2!');
