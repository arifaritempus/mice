const fs = require('fs');

let content = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

// 1. Update Start DatePicker onChange to NOT auto-apply
content = content.replace(/onChange=\{\(date\) => \{[\s\S]*?const newStart = date as Date \| null;[\s\S]*?setPickerRange\(\[newStart, calEnd\]\);[\s\S]*?if \(newStart && calEnd\) \{[\s\S]*?if \(newStart > calEnd\) \{[\s\S]*?setPickerRange\(\[newStart, null\]\);[\s\S]*?\} else \{[\s\S]*?const s = toIsoDate\(newStart\);[\s\S]*?const e = toIsoDate\(calEnd\);[\s\S]*?onStartChange\(s\);[\s\S]*?onEndChange\(e\);[\s\S]*?if \(onApply\) onApply\(s, e\);[\s\S]*?setIsCalendarOpen\(false\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}\}/, `onChange={(date) => {
                const newStart = date as Date | null;
                if (newStart && calEnd && newStart > calEnd) {
                  setPickerRange([newStart, null]);
                } else {
                  setPickerRange([newStart, calEnd]);
                }
              }}`);

// 2. Update End DatePicker onChange to NOT auto-apply
content = content.replace(/onChange=\{\(date\) => \{[\s\S]*?const newEnd = date as Date \| null;[\s\S]*?setPickerRange\(\[calStart, newEnd\]\);[\s\S]*?if \(calStart && newEnd\) \{[\s\S]*?const s = toIsoDate\(calStart\);[\s\S]*?const e = toIsoDate\(newEnd\);[\s\S]*?onStartChange\(s\);[\s\S]*?onEndChange\(e\);[\s\S]*?if \(onApply\) onApply\(s, e\);[\s\S]*?setIsCalendarOpen\(false\);[\s\S]*?\}[\s\S]*?\}\}/, `onChange={(date) => {
                  const newEnd = date as Date | null;
                  setPickerRange([calStart, newEnd]);
                }}`);

// 3. Add ActionBar to renderCalendarContent
content = content.replace(/<\/div>\s*<\/div>\s*\);\s*return \(/, `          </div>
        </div>
      </div>
      {/* Action Bar */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 w-full mt-auto">
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
      </div>
    </div>
  );

  return (`);

fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', content, 'utf8');
