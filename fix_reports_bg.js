const fs = require('fs');

const file = "frontend/src/app/reports/page.tsx";
let content = fs.readFileSync(file, 'utf8');

// 1. Change root div to match homepage: remove bg-slate-50 dark:bg-slate-950, make it scrollable.
content = content.replace(
  /<div className="h-\[calc\(100vh-2rem\)\] flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8 max-w-\[1920px\] mx-auto w-full overflow-hidden transition-colors duration-300">/,
  '<div className="flex flex-col h-full overflow-y-auto pt-4 pb-4 px-4 lg:px-8 gap-4 max-w-[1920px] mx-auto w-full custom-scrollbar text-slate-900 dark:text-slate-100 transition-colors duration-300">'
);

// 2. The table container area:
// Currently:
// <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
//   {/* Table Area */}
//   <div className="flex-1 overflow-auto custom-scrollbar relative">

// We want to remove the fixed flex/min-h constraints so it expands fully.
// And remove overflow-auto so it doesn't have an internal scrollbar (allowing the page to scroll it).
// Wait, if we remove overflow-auto, we lose horizontal scrolling for the table on small screens.
// If we keep overflow-x-auto, sticky top-0 on thead will NOT work relative to the page. 
// A known CSS trick is to not use overflow-x-auto, but let the table expand, or we can make the thead sticky inside the page scroll container.
// Actually, if we just change the main wrapper to `flex-1 overflow-visible relative`, the table will just overflow horizontally on small screens. But since this is a desktop dashboard, it's usually fine.
// But wait! There's a better way. We can make the thead sticky top-0, but if we really need horizontal scroll, we can't easily without nested sticky (which is complex). 
// Let's just use overflow-visible for the table wrapper so thead sticks to the page scroll.

content = content.replace(
  /<div className="bg-white dark:bg-\[#0f172a\] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-\[600px\]">/,
  '<div className="bg-white dark:bg-[#0f172a]/40 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl flex flex-col mb-4">'
);

content = content.replace(
  /<div className="flex-1 overflow-auto custom-scrollbar relative">/,
  '<div className="flex-1 overflow-visible relative w-full overflow-x-auto">'
);

// Oh wait, `overflow-visible overflow-x-auto` will still create a block formatting context that traps `sticky top-0`.
// Let's just write the script to test.

fs.writeFileSync(file, content);
