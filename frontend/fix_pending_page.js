const fs = require('fs');
let file = 'src/app/accounting/invoices/income/pending/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace DateRangeFieldAccounting with ResponsiveDateRangeField
content = content.replace("import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';", "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';");

// Replace Title to Title Case
content = content.replace(
  '<h1 className="text-2xl font-light tracking-wide text-white glow-text uppercase">Bekleyen Gelir Faturaları</h1>',
  '<h1 className="text-2xl font-light tracking-wide text-white glow-text">Bekleyen Gelir Faturaları</h1>'
);

content = content.replace(
  '<p className="text-xs text-slate-400 mt-1">Fatura Kesilmeyi Bekleyen Satış Kalemleri</p>',
  '<p className="text-xs text-slate-400 mt-1">Fatura kesilmeyi bekleyen satış kalemleri</p>'
);

// Replace DateRange component usage
const oldDate = /<DateRangeFieldAccounting\s*label="FATURA TARİHİ"\s*startValue=\{dateRange\.start\}\s*endValue=\{dateRange\.end\}\s*onStartChange=\{\(value\) => setDateRange\(\(prev\) => \(\{ \.\.\.prev, start: value \}\)\)\}\s*onEndChange=\{\(value\) => setDateRange\(\(prev\) => \(\{ \.\.\.prev, end: value \}\)\)\}\s*\/>/;

const newDate = `<ResponsiveDateRangeField
              label="Fatura Tarihi"
              startDate={dateRange.start ? new Date(dateRange.start) : null}
              endDate={dateRange.end ? new Date(dateRange.end) : null}
              onChange={(start, end) => setDateRange({ 
                start: start ? start.toISOString().split('T')[0] : '', 
                end: end ? end.toISOString().split('T')[0] : '' 
              })}
            />`;

content = content.replace(oldDate, newDate);

// The width of the date range wrapper is currently "w-48 shrink-0". Let's make it a bit wider as requested: "biraz daha geniş olsun"
content = content.replace('<div className="w-48 shrink-0">', '<div className="w-64 shrink-0">');

// The label for MultiTokenFilterInput
content = content.replace('label="GENEL ARAMA (VOUCHER, FİRMA, ACENTE, OTEL, VB.)"', 'label="Genel Arama (Voucher, Firma, Acente, Otel, vb.)"');

fs.writeFileSync(file, content, 'utf8');
