const fs = require('fs');
const file = 'frontend/src/components/ResponsiveDateRangeField.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add showMonthDropdown showYearDropdown dropdownMode="select" to mobile DatePicker
const mobileDatePickerRegex = /<DatePicker\s*inline\s*locale=\{tr\}\s*monthsShown=\{1\}\s*selectsRange\s*startDate=\{calStart \|\| undefined\}\s*endDate=\{calEnd \|\| undefined\}\s*onChange=\{\(dates\) => \{[\s\S]*?\}\}\s*calendarClassName="!border-0 !bg-transparent w-full max-w-sm mx-auto"\s*\/>/;

const mobileDatePickerNew = `<DatePicker
                  inline
                  locale={tr}
                  monthsShown={1}
                  selectsRange
                  startDate={calStart || undefined}
                  endDate={calEnd || undefined}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  onChange={(dates) => {
                    const [start, end] = dates as [Date | null, Date | null];
                    setPickerRange([start, end]);
                  }}
                  calendarClassName="!border-0 !bg-transparent w-full max-w-sm mx-auto"
                />`;
content = content.replace(mobileDatePickerRegex, mobileDatePickerNew);

// Also add to desktop DatePicker just in case they want it there too, but let's stick to mobile for now
const desktopDatePickerRegex = /<DatePicker\s*inline\s*locale=\{tr\}\s*monthsShown=\{2\}\s*selectsRange\s*startDate=\{calStart \|\| undefined\}\s*endDate=\{calEnd \|\| undefined\}\s*onChange=\{\(dates\) => \{[\s\S]*?\}\}\s*calendarClassName="!border-none !bg-transparent dark:!text-white"\s*\/>/;

const desktopDatePickerNew = `<DatePicker
              inline
              locale={tr}
              monthsShown={2}
              selectsRange
              startDate={calStart || undefined}
              endDate={calEnd || undefined}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              onChange={(dates) => {
                const [start, end] = dates as [Date | null, Date | null];
                setPickerRange([start, end]);
                if (start && !end) {
                  onStartChange(toIsoDate(start));
                  onEndChange('');
                  return;
                }
                if (start && end) {
                  const s = toIsoDate(start);
                  const e = toIsoDate(end);
                  onStartChange(s);
                  onEndChange(e);
                  onApply(s, e);
                  setIsCalendarOpen(false);
                  return;
                }
                if (!start && !end) {
                  onStartChange('');
                  onEndChange('');
                  onApply('', '');
                }
              }}
              calendarClassName="!border-none !bg-transparent dark:!text-white"
            />`;
content = content.replace(desktopDatePickerRegex, desktopDatePickerNew);

// Remove "Tarih Seçin" header, but keep the X button on the right side.
const headerRegex = /<div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">\s*<h3 className="text-lg font-bold text-gray-900 dark:text-white">Tarih Seçin<\/h3>\s*<button onClick=\{\(\) => setIsCalendarOpen\(false\)\} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">\s*<X size=\{20\} \/>\s*<\/button>\s*<\/div>/;

const headerNew = `<div className="flex items-center justify-end p-2 border-b-0">
                <button onClick={() => setIsCalendarOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors">
                  <X size={20} />
                </button>
              </div>`;
content = content.replace(headerRegex, headerNew);

fs.writeFileSync(file, content);
console.log('Updated ResponsiveDateRangeField.tsx');
