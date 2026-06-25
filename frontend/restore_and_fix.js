const fs = require('fs');

let content = fs.readFileSync('/tmp/ResponsiveDateRangeField_old.tsx', 'utf8');

// 1. Update the Trigger Button to match the desired standard styling (no bg-black/20, standard border)
const oldTriggerBtn = `className="flex items-center justify-between w-full min-w-0 h-10 px-3.5 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"`;
const newTriggerBtn = `className="flex items-center justify-between w-full min-w-0 h-10 px-3.5 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"`;

content = content.replace(oldTriggerBtn, newTriggerBtn);

// 2. Add Temizle and Uygula with improved styling to match what we had before
const oldActionBar = `<div className="flex justify-end gap-3 p-4 sm:px-6 sm:py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 w-full mt-auto">
        <button
          onClick={closeCalendar}
          className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          İptal
        </button>
        <button
          onClick={handleApply}
          disabled={!pickerRange[0]}
          className="flex-1 sm:flex-none px-8 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20"
        >
          Uygula
        </button>
      </div>`;

const newActionBar = `      <div className="border-t border-slate-100 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 w-full mt-auto">
        <button
          onClick={handleClear}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          Temizle
        </button>
        <button
          onClick={handleApply}
          disabled={!pickerRange[0] || !pickerRange[1]}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm tracking-wide"
        >
          Uygula
        </button>
      </div>`;

content = content.replace(oldActionBar, newActionBar);

// Save to the real file
fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', content, 'utf8');
console.log("Restored and patched ResponsiveDateRangeField.tsx");
