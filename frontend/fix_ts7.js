const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

const startIdx = code.indexOf('{false && typeof document');
if (startIdx !== -1) {
  const endStr = ')}';
  const endIdx = code.indexOf(endStr, startIdx);
  if (endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx + endStr.length);
  }
}

// Remove pickerRange state as well since it's unused
code = code.replace(/const \[pickerRange, setPickerRange\] = useState<\[Date \| null, Date \| null\]>\(\[null, null\]\);\n/, '');

// Remove rangeCalendarPos state as well since it's unused
code = code.replace(/const \[rangeCalendarPos, setRangeCalendarPos\] = useState\(\{ top: 0, left: 0 \}\);\n/, '');

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed TS 7');
