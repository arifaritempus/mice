const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// 1. Layout wrappers
content = content.replace(
  /<div className="flex flex-col h-\[calc\(100vh-2rem\)\] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 overflow-hidden">/g,
  '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
);
content = content.replace(
  /<div className="w-full min-w-0 flex flex-col flex-1 min-h-0">/g,
  '<div className="w-full min-w-0 flex-1 flex flex-col">'
);

// 2. Header
content = content.replace(
  /<div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 rounded-lg mb-2">/g,
  '<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">'
);
content = content.replace(
  /<div className="flex justify-between items-center p-2">\s*<div>\s*<h1 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">Sejour Yönetimi<\/h1>\s*<p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Sejour işlemlerini yönetin<\/p>\s*<\/div>/g,
  '<div className="shrink-0 mr-4">\n<h1 className="text-2xl font-light tracking-wide text-white glow-text">Sejour Yönetimi</h1>\n<p className="text-xs text-slate-400 mt-1">Sejour işlemlerini yönetin</p>\n</div>'
);
content = content.replace(
  /<div className="flex gap-2">/g,
  '<div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">'
);

// 3. Stats Strip & Table Wrapper
content = content.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Data Table \*\/\}/g,
  '</div>\n</div>\n{/* Data Table */}'
);

content = content.replace(
  /<div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden transition-colors duration-200">/g,
  '<div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden">'
);

// 4. Table header
content = content.replace(
  /<thead className="bg-gray-50 dark:bg-gray-700\/50 sticky top-0 z-20 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">/g,
  '<thead className="bg-[#1e293b]/95 sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-white/10">'
);
content = content.replace(
  /className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"/g,
  'className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10"'
);

// 5. Table Body
content = content.replace(
  /<tbody className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">/g,
  '<tbody className="divide-y divide-white/5">'
);

// 6. Rows
content = content.replace(
  /<tr key=\{sejour\.id\} className="hover:bg-gray-50 dark:hover:bg-gray-700">/g,
  '<tr key={sejour.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0" onDoubleClick={() => router.push(`/sejour/${sejour.id}`)}>'
);

// 7. Cells
content = content.replace(
  /className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white"/g,
  'className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-white"'
);
content = content.replace(
  /className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300"/g,
  'className="px-2.5 py-2.5 whitespace-nowrap text-xs text-slate-200"'
);

// 8. Oda text
content = content.replace(
  /Oda \{room\.roomNumber \|\| index \+ 1\}/g,
  '{String(room.roomNumber || "").toLowerCase().includes("oda") ? room.roomNumber : `Oda ${room.roomNumber || index + 1}`}'
);

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
