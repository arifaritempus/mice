const fs = require('fs');

const file = 'frontend/src/app/reports/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('DateRangeFieldAccounting')) {
  content = content.replace("import DatePicker from 'react-datepicker';", "import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';");
}

// 2. Remove the DatePicker portal at the end
const portalStart = "{isDateRangeOpen && typeof document !== 'undefined' && createPortal(";
const portalIdx = content.indexOf(portalStart);
if (portalIdx > -1) {
  // Find where it ends
  const endPortalString = "document.body\n      )}";
  const endIdx = content.indexOf(endPortalString, portalIdx);
  if (endIdx > -1) {
    content = content.substring(0, portalIdx) + content.substring(endIdx + endPortalString.length);
  }
}

// 3. Replace the inputs with DateRangeFieldAccounting
const datesAreaStart = "              {/* Dates */}\n              <div className=\"flex items-center gap-1 shrink-0\">";
const datesIdx = content.indexOf(datesAreaStart);
if (datesIdx > -1) {
  const datesAreaEnd = "              </div>\n\n              {/* Buttons */}";
  const endIdx = content.indexOf(datesAreaEnd, datesIdx);
  if (endIdx > -1) {
    const replacement = `              {/* Dates */}
              <div className="flex items-center gap-1 shrink-0 min-w-[220px]">
                <DateRangeFieldAccounting
                  label=""
                  hideLabel={true}
                  startValue={startDate}
                  endValue={endDate}
                  onStartChange={(val) => { setStartDate(val); setDatePreset('ozel'); }}
                  onEndChange={(val) => { setEndDate(val); setDatePreset('ozel'); }}
                />
`;
    content = content.substring(0, datesIdx) + replacement + content.substring(endIdx);
  }
}

fs.writeFileSync(file, content);
console.log("Fixed reports date picker");
