const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Stack the inputs
  content = content.replace(
    /<div className="flex gap-0\.5">/g,
    '<div className="flex flex-col sm:flex-row gap-0.5 w-full">'
  );

  // 2. Change the createPortal first argument to be wrapped in a Fragment.
  // The original has: `createPortal(\n          <div`
  // We change it to: `createPortal(\n          <>\n            <div className="fixed inset-0 z-[9998] bg-black/50 sm:hidden" onClick={() => setIsCalendarOpen(false)} />\n          <div`
  content = content.replace(
    /createPortal\(\s*<div/g,
    'createPortal(\n          <>\n            <div className="fixed inset-0 z-[9998] bg-black/50 sm:hidden" onClick={() => setIsCalendarOpen(false)} />\n          <div'
  );

  // 3. Make the popup a bottom-sheet on mobile
  const popupRegex = /className="transfer-range-datepicker-popover fixed z-\[9999\] w-max max-w-\[calc\(100vw-0\.75rem\)\] shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 overflow-x-auto"\s+style=\{\{ top: `\$\{calendarStyle\.top\}px`, left: `\$\{calendarStyle\.left\}px` \}\}\s+>/g;

  const newPopup = `className="transfer-range-datepicker-popover fixed z-[9999] w-full max-w-[100vw] sm:w-max sm:max-w-[calc(100vw-0.75rem)] shadow-2xl rounded-t-3xl sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-2 overflow-x-auto bottom-0 left-0 sm:bottom-auto sm:top-[var(--cal-top)] sm:left-[var(--cal-left)]"
            style={typeof window !== 'undefined' && window.innerWidth < 640 ? {} : { '--cal-top': \`\${calendarStyle.top}px\`, '--cal-left': \`\${calendarStyle.left}px\` } as any}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3 sm:hidden" />`;

  content = content.replace(popupRegex, newPopup);

  // 4. Change monthsShown to be responsive
  content = content.replace(
    /monthsShown=\{2\}/g,
    "monthsShown={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2}"
  );

  // 5. Add a "Tamam" button at the end of the popup, AND close the Fragment!
  // The original has: `/>\n          </div>,\n          document.body`
  const datePickerClose = `/>\n            <button onClick={() => setIsCalendarOpen(false)} className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl sm:hidden">Tamam</button>\n          </div>\n          </>,\n`;
  
  content = content.replace(/\/>\s*<\/div>,\s*(document\.body)/g, datePickerClose + '          $1');

  fs.writeFileSync(filePath, content);
  console.log('Patched', filePath);
}

patchFile('frontend/src/app/operations/tickets/page.tsx');
patchFile('frontend/src/app/operations/transfers/page.tsx');
patchFile('frontend/src/app/operations/guides/page.tsx');
patchFile('frontend/src/app/operations/part-time/page.tsx');
