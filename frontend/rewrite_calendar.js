const fs = require('fs');

let content = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

// The goal is to replace the flex-row container that holds two DatePickers
// with a single DatePicker that has selectsRange=true and monthsShown=2

const regex = /<div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full justify-center">[\s\S]*?\{!\isMobile && \([\s\S]*?<\/div>\s*\)\}\s*<\/div>/;

const replacement = `<div className="flex flex-col md:flex-row w-full justify-center custom-range-picker-container">
          <DatePicker
            inline
            locale={tr}
            monthsShown={isMobile ? 1 : 2}
            selectsRange
            startDate={calStart || undefined}
            endDate={calEnd || undefined}
            onChange={(dates) => {
              const [start, end] = dates as [Date | null, Date | null];
              setPickerRange([start, end]);
            }}
            renderCustomHeader={({
              date,
              changeYear,
              changeMonth,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div className="flex justify-between items-center px-2 py-2 mb-2">
                <button
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  type="button"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="flex gap-1.5 font-semibold text-sm">
                  <select
                    value={months[date.getMonth()]}
                    onChange={({ target: { value } }) =>
                      changeMonth(months.indexOf(value))
                    }
                    className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                  >
                    {months.map((m) => (
                      <option
                        key={m}
                        value={m}
                        className="bg-white dark:bg-slate-800"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) =>
                      changeYear(Number(value))
                    }
                    className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                  >
                    {years.map((y) => (
                      <option
                        key={y}
                        value={y}
                        className="bg-white dark:bg-slate-800"
                      >
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  type="button"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
            calendarClassName="!border-0 !bg-transparent mx-auto"
          />
        </div>`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', content, 'utf8');
  console.log("Replaced successfully.");
} else {
  console.log("Regex did not match.");
}
