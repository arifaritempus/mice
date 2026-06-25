const fs = require('fs');
let content = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

const oldHeader = `              <div className="flex gap-1.5 font-semibold text-sm">
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
              </div>`;

const newHeader = `              <div className="flex gap-1.5 font-semibold text-sm">
                <select 
                  value={months[date.getMonth()]} 
                  onChange={({ target: { value } }) => {
                    const newMonth = months.indexOf(value);
                    if (customHeaderCount === 1) {
                      if (newMonth === 0) {
                        changeYear(date.getFullYear() - 1);
                        changeMonth(11);
                      } else {
                        changeYear(date.getFullYear());
                        changeMonth(newMonth - 1);
                      }
                    } else {
                      changeMonth(newMonth);
                    }
                  }}
                  className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                >
                  {months.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-800">{m}</option>)}
                </select>
                <select 
                  value={date.getFullYear()} 
                  onChange={({ target: { value } }) => {
                    const newYear = Number(value);
                    if (customHeaderCount === 1) {
                      if (date.getMonth() === 0) {
                        changeYear(newYear - 1);
                        changeMonth(11);
                      } else {
                        changeYear(newYear);
                        changeMonth(date.getMonth() - 1);
                      }
                    } else {
                      changeYear(newYear);
                    }
                  }}
                  className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                >
                  {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-800">{y}</option>)}
                </select>
              </div>`;

if (content.includes('customHeaderCount === 1 ? (')) {
  content = content.replace(oldHeader, newHeader);
  fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', content, 'utf8');
  console.log("Fixed dropdowns!");
} else {
  console.log("Could not find the target string.");
}
