const fs = require('fs');

// 1. Fix sejour clearAllFilters
let sejourContent = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');
sejourContent = sejourContent.replace(
  /const clearAllFilters = \(\) => \{\n    setDateStart\(''\);\n    setDateEnd\(''\);\n    setGlobalTokens\(\[\]\);\n    setGlobalInput\(''\);\n    setPage\(1\);\n  \};/,
  `const clearAllFilters = () => {
    setDateStart('');
    setDateEnd('');
    setAppliedDateStart('');
    setAppliedDateEnd('');
    setGlobalTokens([]);
    setGlobalInput('');
    setStatusFilter('all');
    setPage(1);
  };`
);
fs.writeFileSync('src/app/sejour/page.tsx', sejourContent, 'utf8');

// 2. Fix ResponsiveDateRangeField
let dateRangeContent = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

const oldHeader = `          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled
          }) => (
            <div className="flex justify-between items-center px-2 py-2 mb-2">
              <button 
                onClick={decreaseMonth} 
                disabled={prevMonthButtonDisabled} 
                type="button" 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="flex gap-1.5 font-semibold text-sm">
                <select 
                  value={months[date.getMonth()]} 
                  onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                  className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                >
                  {months.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-800">{m}</option>)}
                </select>
                <select 
                  value={date.getFullYear()} 
                  onChange={({ target: { value } }) => changeYear(Number(value))}
                  className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                >
                  {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-800">{y}</option>)}
                </select>
              </div>

              <button 
                onClick={increaseMonth} 
                disabled={nextMonthButtonDisabled} 
                type="button" 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}`;

const newHeader = `          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
            customHeaderCount
          }) => (
            <div className="flex justify-between items-center px-2 py-2 mb-2">
              <button 
                onClick={decreaseMonth} 
                disabled={prevMonthButtonDisabled} 
                type="button" 
                className={\`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors \${customHeaderCount === 1 ? 'invisible' : ''}\`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="flex gap-1.5 font-semibold text-sm">
                {customHeaderCount === 1 ? (
                  <span className="text-slate-800 dark:text-slate-200">{months[date.getMonth()]} {date.getFullYear()}</span>
                ) : (
                  <>
                    <select 
                      value={months[date.getMonth()]} 
                      onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                      className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                    >
                      {months.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-800">{m}</option>)}
                    </select>
                    <select 
                      value={date.getFullYear()} 
                      onChange={({ target: { value } }) => changeYear(Number(value))}
                      className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                    >
                      {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-800">{y}</option>)}
                    </select>
                  </>
                )}
              </div>

              <button 
                onClick={increaseMonth} 
                disabled={nextMonthButtonDisabled} 
                type="button" 
                className={\`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors \${customHeaderCount === 0 && !isMobile ? 'invisible' : ''}\`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}`;

if (dateRangeContent.includes('renderCustomHeader={({')) {
  dateRangeContent = dateRangeContent.replace(oldHeader, newHeader);
  fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', dateRangeContent, 'utf8');
  console.log("Fixed ResponsiveDateRangeField header!");
} else {
  console.log("Could not find renderCustomHeader to replace");
}
