const fs = require('fs');

let content = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

const targetStr = `<DatePicker
          inline
          locale={tr}
          monthsShown={1}
          selectsRange
          startDate={calStart || undefined}
          endDate={calEnd || undefined}
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
            }
          }}
          renderCustomHeader={({
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
          )}
          calendarClassName="!border-0 !bg-transparent w-full mx-auto"
        />`;

const replaceStr = `        <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full justify-center">
          <div className="flex flex-col">
            <DatePicker
              inline
              locale={tr}
              selectsStart
              selected={calStart || undefined}
              startDate={calStart || undefined}
              endDate={calEnd || undefined}
              onChange={(date) => {
                const newStart = date as Date | null;
                setPickerRange([newStart, calEnd]);
                if (newStart && calEnd) {
                  if (newStart > calEnd) {
                    setPickerRange([newStart, null]);
                  } else {
                    const s = toIsoDate(newStart);
                    const e = toIsoDate(calEnd);
                    onStartChange(s);
                    onEndChange(e);
                    if (onApply) onApply(s, e);
                    setIsCalendarOpen(false);
                  }
                }
              }}
              renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled
              }) => (
                <div className="flex justify-between items-center px-2 py-2 mb-2">
                  <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex gap-1.5 font-semibold text-sm">
                    <select value={months[date.getMonth()]} onChange={({ target: { value } }) => changeMonth(months.indexOf(value))} className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center">
                      {months.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-800">{m}</option>)}
                    </select>
                    <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(Number(value))} className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center">
                      {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-800">{y}</option>)}
                    </select>
                  </div>
                  <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
              calendarClassName="!border-0 !bg-transparent w-full mx-auto"
            />
          </div>

          {!isMobile && (
            <div className="flex flex-col">
              <DatePicker
                inline
                locale={tr}
                selectsEnd
                selected={calEnd || undefined}
                startDate={calStart || undefined}
                endDate={calEnd || undefined}
                minDate={calStart || undefined}
                onChange={(date) => {
                  const newEnd = date as Date | null;
                  setPickerRange([calStart, newEnd]);
                  if (calStart && newEnd) {
                    const s = toIsoDate(calStart);
                    const e = toIsoDate(newEnd);
                    onStartChange(s);
                    onEndChange(e);
                    if (onApply) onApply(s, e);
                    setIsCalendarOpen(false);
                  }
                }}
                renderCustomHeader={({
                  date,
                  changeYear,
                  changeMonth,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled
                }) => (
                  <div className="flex justify-between items-center px-2 py-2 mb-2">
                    <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex gap-1.5 font-semibold text-sm">
                      <select value={months[date.getMonth()]} onChange={({ target: { value } }) => changeMonth(months.indexOf(value))} className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center">
                        {months.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-800">{m}</option>)}
                      </select>
                      <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(Number(value))} className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center">
                        {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-800">{y}</option>)}
                      </select>
                    </div>
                    <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                )}
                calendarClassName="!border-0 !bg-transparent w-full mx-auto"
              />
            </div>
          )}
        </div>`;

if (content.includes('monthsShown={1}')) {
  let [before, after] = content.split(targetStr);
  if (before && after) {
    fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', before + replaceStr + after, 'utf8');
    console.log("Replaced successfully!");
  } else {
    console.log("Could not split");
  }
} else {
  console.log("Could not find targetStr");
}
