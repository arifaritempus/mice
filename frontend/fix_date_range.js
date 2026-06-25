const fs = require('fs');
let file = 'src/app/accounting/invoices/income/pending/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldDate = /<ResponsiveDateRangeField[\s\S]*?onChange=\{[\s\S]*?\}\s*\/>/;

const newDate = `<ResponsiveDateRangeField
              label="Fatura Tarihi"
              startValue={dateRange.start}
              endValue={dateRange.end}
              onStartChange={(value) => setDateRange((prev) => ({ ...prev, start: value }))}
              onEndChange={(value) => setDateRange((prev) => ({ ...prev, end: value }))}
              onApply={() => {}}
            />`;

content = content.replace(oldDate, newDate);

fs.writeFileSync(file, content, 'utf8');
