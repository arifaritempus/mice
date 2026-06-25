const fs = require('fs');
let content = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

const targetStr = `  const renderCalendarContent = () => (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto w-full flex items-center justify-center p-2 sm:p-5 custom-datepicker-wrapper">
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
                <select 
                  value={months[date.getMonth()]} 
                  onChange={({ target: { value } }) => {
                    const newMonth = months.indexOf(value);
                    if (customHeaderCount === 1) {
                      if (newMonth === 0) {
                        changeYear(date.getFullYear() - 1);
                        setTimeout(() => changeMonth(11), 0);
                      } else {
                        changeYear(date.getFullYear());
                        setTimeout(() => changeMonth(newMonth - 1), 0);
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
                      changeYear(date.getMonth() === 0 ? newYear - 1 : newYear);
                    } else {
                      changeYear(newYear);
                    }
                  }}
                  className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer appearance-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                >
                  {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-800">{y}</option>)}
                </select>
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
          )}
        />`;

const replacement = `  const renderCalendarContent = () => {
    const handleDateChange = (dates) => {
      const [start, end] = dates;
      setPickerRange([start, end]);
      if (start && end) {
        const s = toIsoDate(start);
        const e = toIsoDate(end);
        onStartChange(s);
        onEndChange(e);
        if (onApply) onApply(s, e);
        setIsCalendarOpen(false);
      }
    };

    const commonProps = {
      inline: true,
      locale: tr,
      selectsRange: true,
      startDate: calStart || undefined,
      endDate: calEnd || undefined,
      onChange: handleDateChange,
      renderCustomHeader: ({
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
      )
    };

    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 overflow-y-auto w-full flex flex-col md:flex-row items-center justify-center p-2 sm:p-5 custom-datepicker-wrapper gap-4 md:gap-8">
          {/* Başlangıç Takvimi */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">Başlangıç Tarihi İçin</span>
            <DatePicker {...commonProps} />
          </div>
          
          {/* Bitiş Takvimi - Sadece Masaüstünde */}
          {!isMobile && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">Bitiş Tarihi İçin</span>
              <DatePicker {...commonProps} />
            </div>
          )}
        </div>`;

if (content.includes('monthsShown={isMobile ? 1 : 2}')) {
  let [before, after] = content.split(targetStr);
  if (before && after) {
    fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', before + replacement + after, 'utf8');
    console.log("Success!");
  } else {
    console.log("Split failed");
  }
} else {
  console.log("Could not find target");
}
