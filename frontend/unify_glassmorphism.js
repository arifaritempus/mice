const fs = require('fs');

// 1. Fix /sejour/services/page.tsx
let content = fs.readFileSync('src/app/sejour/services/page.tsx', 'utf8');

// Replace table wrapper
content = content.replace(
  '<div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">',
  '<div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">'
);

// Replace table scroll wrapper
content = content.replace(
  '<div className="overflow-auto w-full flex-1">',
  '<div className="flex-1 overflow-auto custom-scrollbar">'
);

// Replace table class
content = content.replace(
  '<table className="min-w-[1200px] w-full text-sm text-left">',
  '<table className="w-full text-left border-collapse min-w-[1200px]">'
);

// Replace thead class
content = content.replace(
  '<thead className="text-xs text-slate-400 uppercase bg-[#0f172a]/60 sticky top-0 z-10 backdrop-blur-sm border-b border-white/10">',
  '<thead className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">'
);

// Replace th classes (we already have px-2.5 py-2.5 text-xs text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors duration-200)
// Need to add border-b border-white/10 if missing
content = content.replace(/hover:bg-white\/5 transition-colors duration-200"/g, 'hover:bg-white/10 transition-colors border-b border-white/10"');

// Replace tbody class
content = content.replace(
  '<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">',
  '<tbody className="divide-y divide-white/5">'
);

// Replace pagination wrapper if it exists (usually bg-white dark:bg-gray-800)
content = content.replace(
  '<div className="flex justify-end px-2 py-2 border-t border-gray-200 dark:border-gray-700">',
  '<div className="flex justify-end px-4 py-3 bg-[#0f172a]/60 backdrop-blur-md border-t border-white/10">'
);

// Loading and Error block wrappers
content = content.replace(
  '<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 mb-2 transition-colors duration-200">',
  '<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4 shadow-sm">'
);
content = content.replace(
  '<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 mb-2 transition-colors duration-200">',
  '<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4 shadow-sm">'
);

fs.writeFileSync('src/app/sejour/services/page.tsx', content, 'utf8');

// 2. Fix /sejour/page.tsx
let content2 = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// Replace table wrapper
content2 = content2.replace(
  '<div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0 relative">',
  '<div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">'
);

// Replace table scroll wrapper
content2 = content2.replace(
  '<div className="overflow-auto w-full flex-1">',
  '<div className="flex-1 overflow-auto custom-scrollbar">'
);

// Replace table class
content2 = content2.replace(
  '<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">',
  '<table className="w-full text-left border-collapse min-w-[1200px]">'
);

// Replace thead class
content2 = content2.replace(
  '<thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">',
  '<thead className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">'
);

// Ensure th styling matches V3 glassmorphism
content2 = content2.replace(/<th\s+className="px-2.5 py-2.5 text-left text-\[11px\] font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-white\/5 border-b border-white\/10"/g, 
  '<th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"');

// Replace tbody class
content2 = content2.replace(
  '<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">',
  '<tbody className="divide-y divide-white/5">'
);

// Fix tr hover class to standard V3 (if not already exact)
// In sejour/page.tsx it is: hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0
// This is already correct.
// Fix td text color class: text-gray-900 dark:text-white -> text-white
content2 = content2.replace(/text-gray-900 dark:text-white/g, 'text-white');

// Replace pagination wrapper
content2 = content2.replace(
  '<div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-auto">',
  '<div className="flex justify-between items-center px-4 py-3 bg-[#0f172a]/60 backdrop-blur-md border-t border-white/10 sm:px-6 mt-auto">'
);
content2 = content2.replace(
  '<div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">',
  '<div className="flex justify-between items-center px-4 py-3 bg-[#0f172a]/60 backdrop-blur-md border-t border-white/10 sm:px-6">'
);

fs.writeFileSync('src/app/sejour/page.tsx', content2, 'utf8');

console.log("Glassmorphism styles applied to both pages.");
