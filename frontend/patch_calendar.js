const fs = require('fs');

let content = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

// 1. Remove the Uygula/Temizle button area
const actionBarRegex = /<div className="border-t border-slate-100 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800\/50 w-full mt-auto">[\s\S]*?<\/div>\s*(?=<\/div>\s*\);\s*return)/;
content = content.replace(actionBarRegex, '');

// 2. Add getYear, getMonth and the months array for custom header
const dateFnsImports = /import \{ format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO \} from 'date-fns';/;
content = content.replace(dateFnsImports, `import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO, getYear, getMonth } from 'date-fns';`);

// 3. Replace the DatePicker with one that uses renderCustomHeader and auto-apply onChange
const datePickerRegex = /<DatePicker[\s\S]*?calendarClassName="!border-0 !bg-transparent w-full mx-auto"\s*\/>/;

const newDatePicker = `        <DatePicker
          inline
          locale={tr}
          monthsShown={isMobile ? 1 : 2}
          selectsRange
          startDate={calStart || undefined}
          endDate={calEnd || undefined}
          calendarClassName="!border-0 !bg-transparent w-full mx-auto"
          onChange={(dates) => {
            const [start, end] = dates as [Date | null, Date | null];
            setPickerRange([start, end]);
            if (start && end) {
              const s = toIsoDate(start);
              const e = toIsoDate(end);
              onStartChange(s);
              onEndChange(e);
              if (onApply) onApply(s, e);
              setIsCalendarOpen(false);
            } else if (!start && !end) {
              onStartChange('');
              onEndChange('');
              if (onApply) onApply('', '');
            } else if (start && !end) {
              onStartChange(toIsoDate(start));
              onEndChange('');
            }
          }}
          renderCustomHeader={({
            monthDate,
            customHeaderCount,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
            changeYear,
            changeMonth,
          }) => {
            const months = [
              "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
              "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ];
            const years = [];
            const currentYear = new Date().getFullYear();
            for (let i = currentYear - 10; i <= currentYear + 10; i++) {
              years.push(i);
            }

            return (
              <div className="flex items-center justify-between px-2 py-2">
                <button
                  aria-label="Previous Month"
                  className={\`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors \${
                    prevMonthButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }\`}
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  style={{ visibility: customHeaderCount === 1 ? "hidden" : "visible" }}
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                
                <div className="flex items-center gap-2">
                  <select
                    value={months[getMonth(monthDate)]}
                    onChange={({ target: { value } }) =>
                      changeMonth(months.indexOf(value))
                    }
                    className="appearance-none bg-transparent font-bold text-slate-800 dark:text-slate-100 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                  >
                    {months.map((option) => (
                      <option key={option} value={option} className="text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={getYear(monthDate)}
                    onChange={({ target: { value } }) => changeYear(Number(value))}
                    className="appearance-none bg-transparent font-bold text-slate-800 dark:text-slate-100 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                  >
                    {years.map((option) => (
                      <option key={option} value={option} className="text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  aria-label="Next Month"
                  className={\`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors \${
                    nextMonthButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }\`}
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  style={{ visibility: customHeaderCount === 0 && !isMobile ? "hidden" : "visible" }}
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            );
          }}
        />`;

content = content.replace(datePickerRegex, newDatePicker);

// Also remove standard react-datepicker header CSS tweaks since we use custom header now
const cssToRemove = `        /* Header styling */
        .custom-datepicker-wrapper .react-datepicker__header {
          background: transparent !important;
          border-bottom: none !important;
          padding-top: 0.5rem;
          padding-bottom: 0;
        }`;
content = content.replace(cssToRemove, '');

const cssToRemove2 = `        /* Navigation Arrows */
        .custom-datepicker-wrapper .react-datepicker__navigation {
          top: 1rem !important;
          height: 2rem !important;
          width: 2rem !important;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation:hover {
          background-color: #f1f5f9;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__navigation:hover {
          background-color: #1e293b;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #64748b;
          border-width: 2px 2px 0 0;
          height: 8px;
          width: 8px;
          top: 8px;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #94a3b8;
        }`;
content = content.replace(cssToRemove2, '');

fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', content, 'utf8');
console.log("Patched ResponsiveDateRangeField.tsx");
