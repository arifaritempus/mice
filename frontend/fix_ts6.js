const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// remove createPortal logic
const portalRegex = /\{isDateRangeOpen && createPortal\([\s\S]*?\}\)/g;
code = code.replace(portalRegex, '');

// remove useEffect logic that relies on isDateRangeOpen
code = code.replace(/useEffect\(\(\) => \{\n\s*if \(!isDateRangeOpen\) return;[\s\S]*?\}\n\s*\}\n\s*\}, \[isDateRangeOpen\]\);/g, '');

// remove calculateCalendarPos
code = code.replace(/const calculateCalendarPos = \(\) => \{[\s\S]*?\}\n\s*\};/g, '');

// remove useLayoutEffect related to calendar pos
code = code.replace(/useLayoutEffect\(\(\) => \{\n\s*if \(isDateRangeOpen\) \{[\s\S]*?\}, \[isDateRangeOpen\]\);/g, '');

// remove close date picker
code = code.replace(/const closeDatePicker = \(\) => \{[\s\S]*?setIsDateRangeOpen\(false\);\n\s*\};/g, '');

// just add a dummy boolean to silence any leftover references, or better yet regex remove everything
code = code.replace(/setIsDateRangeOpen\([^)]*\)/g, '');
code = code.replace(/isDateRangeOpen/g, 'false');

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed TS 6');
