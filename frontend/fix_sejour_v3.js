const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/services/page.tsx', 'utf8');

// 1. Replace main wrapper
content = content.replace(
  '<div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">',
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
);
content = content.replace(
  '<div className="w-full min-w-0 flex flex-col flex-1">',
  '<div className="w-full min-w-0 flex-1 flex flex-col">'
);

// 2. Change table header and cell paddings
// Find all px-2 py-2 in th and td, change to px-2.5 py-2.5
content = content.replace(/className="px-2 py-2 /g, 'className="px-2.5 py-2.5 ');
content = content.replace(/className="px-2 py-2"/g, 'className="px-2.5 py-2.5"');
// Wait, some might be px-2 py-4
content = content.replace(/className="px-2 py-4 /g, 'className="px-2.5 py-4 ');

// 3. Update table row hover and double click
// Old row: <tr key={`${r.voucherNumber}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
const newRow = `<tr key={\`\${r.voucherNumber}-\${idx}\`} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0" onDoubleClick={() => router.push('/sejour?search=' + r.voucherNumber)}>`;
content = content.replace(/<tr key=\{\`\$\{r.voucherNumber\}\-\$\{idx\}\`\} className="hover:bg-gray-50 dark:hover:bg-gray-800\/40">/g, newRow);

// 4. Update Header and Stats Strip
// The header:
// <div className="flex justify-between items-center mb-4">
//   <div>
//     <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Sejour Hizmet Listesi</h1>
//     <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Konfirme olan sejour rezervasyonları ve hizmet detayları.</p>
//   </div>
// ...
const oldHeader = `<div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Sejour Hizmet Listesi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Konfirme olan sejour rezervasyonları ve hizmet detayları.</p>
          </div>`;

const newHeader = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Sejour Hizmet Listesi</h1>
            <p className="text-sm text-slate-400">Sejour hizmet kalemlerini inceleyin ve filtreleyin.</p>
          </div>`;

content = content.replace(oldHeader, newHeader);

// Fix buttons wrapper
content = content.replace(
  '<div className="flex gap-2">',
  '<div className="flex items-center gap-3">'
);

// Fix the stats strip? Let's check where the filters are.
// <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 transition-colors duration-200 p-3">
content = content.replace(
  '<div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 transition-colors duration-200 p-3">',
  '<div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-sm shrink-0 flex flex-col gap-4 z-10">'
);

// 5. Update Dates to include getDayNameShort
// <td>{formatDate(r.checkInDate)}</td>
content = content.replace(
  /<td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">\{formatDate\(r\.checkInDate\)\}<\/td>/g,
  `<td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-white">
                          <div className="flex items-center">
                            <span>{formatDate(r.checkInDate)}</span>
                            {r.checkInDate && <span className="text-slate-500 ml-1 text-[10px] uppercase font-medium tracking-wider">, {getDayNameShort(r.checkInDate)}</span>}
                          </div>
                        </td>`
);

content = content.replace(
  /<td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">\{formatDate\(r\.checkOutDate\)\}<\/td>/g,
  `<td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-white">
                          <div className="flex items-center">
                            <span>{formatDate(r.checkOutDate)}</span>
                            {r.checkOutDate && <span className="text-slate-500 ml-1 text-[10px] uppercase font-medium tracking-wider">, {getDayNameShort(r.checkOutDate)}</span>}
                          </div>
                        </td>`
);

// Change text-gray-900 to text-white for text colors
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white');
content = content.replace(/text-gray-500 dark:text-gray-300/g, 'text-slate-400');
content = content.replace(/hover:bg-gray-100 dark:hover:bg-gray-600/g, 'hover:bg-white/5');

// Find and replace table styling
content = content.replace(
  '<table className="min-w-[1200px] w-full divide-y divide-gray-200 dark:divide-gray-700">',
  '<table className="min-w-[1200px] w-full text-sm text-left">'
);

content = content.replace(
  '<thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">',
  '<thead className="text-xs text-slate-400 uppercase bg-[#0f172a]/60 sticky top-0 z-10 backdrop-blur-sm border-b border-white/10">'
);

// Also the "Satış Hizmetleri" / "Alış Hizmetleri" tabs
// <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
const oldTabs = `<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            className={\`px-4 py-2 font-medium text-sm transition-colors duration-200 \${activeTab === 'sales' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}\`}
            onClick={() => { setActiveTab('sales'); setPage(1); }}
          >
            SATIŞ HİZMETLERİ
          </button>
          <button
            className={\`px-4 py-2 font-medium text-sm transition-colors duration-200 \${activeTab === 'costs' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}\`}
            onClick={() => { setActiveTab('costs'); setPage(1); }}
          >
            ALIŞ HİZMETLERİ
          </button>
        </div>`;

const newTabs = `<div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-sm shrink-0">
          <button
            className={\`px-4 py-2 font-medium text-sm transition-colors duration-200 rounded-lg \${activeTab === 'sales' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}\`}
            onClick={() => { setActiveTab('sales'); setPage(1); }}
          >
            SATIŞ HİZMETLERİ
          </button>
          <button
            className={\`px-4 py-2 font-medium text-sm transition-colors duration-200 rounded-lg \${activeTab === 'costs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}\`}
            onClick={() => { setActiveTab('costs'); setPage(1); }}
          >
            ALIŞ HİZMETLERİ
          </button>
        </div>`;

content = content.replace(oldTabs, newTabs);

fs.writeFileSync('src/app/sejour/services/page.tsx', content, 'utf8');
console.log("Modernization rules applied.");
