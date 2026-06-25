const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/payments/page.tsx', 'utf8');

// 1. Subtitle replace
content = content.replace(
  'Konfirme biletlerin ödeme planlarını ve kayıtlarını yönetin',
  'Biletin ödeme planlarını yönetin'
);

// 2. Add paymentDateRange state
if (!content.includes('paymentDateRange')) {
  content = content.replace(
    'const [departureDateRange, setDepartureDateRange] = useState({ startDate: \'\', endDate: \'\' })',
    `const [departureDateRange, setDepartureDateRange] = useState({ startDate: '', endDate: '' })
  const [paymentDateRange, setPaymentDateRange] = useState({ startDate: toCalendarYmd(new Date()), endDate: '' })`
  );
  
  // Update dependencies
  content = content.replace(
    `[voucherTokens, departureDateRange.startDate, departureDateRange.endDate, sortBy]`,
    `[voucherTokens, departureDateRange.startDate, departureDateRange.endDate, paymentDateRange.startDate, paymentDateRange.endDate, sortBy]`
  );
  
  content = content.replace(
    `[confirmedTickets, voucherTokens, departureDateRange.startDate, departureDateRange.endDate, paymentPlans, paymentRecords, sortBy, toCalendarYmd]`,
    `[confirmedTickets, voucherTokens, departureDateRange.startDate, departureDateRange.endDate, paymentDateRange.startDate, paymentDateRange.endDate, paymentPlans, paymentRecords, sortBy, toCalendarYmd]`
  );
  
  // Filter logic update
  const filterBlockOld = `      // Gidiş/Dönüş tarihi kontrolü
      const departureYmd = toCalendarYmd(ticket.departure_date)
      const returnYmd = toCalendarYmd(ticket.return_date)
      if (departureDateRange.startDate) {
        if (!departureYmd || departureYmd < departureDateRange.startDate) return false
      }
      if (departureDateRange.endDate) {
        if (!returnYmd || returnYmd > departureDateRange.endDate) return false
      }`;
      
  const filterBlockNew = `      // Gidiş/Dönüş tarihi kontrolü
      const departureYmd = toCalendarYmd(ticket.departure_date)
      const returnYmd = toCalendarYmd(ticket.return_date)
      if (departureDateRange.startDate) {
        if (!departureYmd || departureYmd < departureDateRange.startDate) return false
      }
      if (departureDateRange.endDate) {
        if (!returnYmd || returnYmd > departureDateRange.endDate) return false
      }
      
      // Ödeme Tarihi kontrolü (taksit tarihleri üzerinden)
      if (paymentDateRange.startDate || paymentDateRange.endDate) {
        const tPlans = paymentPlans.filter(p => p.ticket_id === ticket.id);
        if (tPlans.length === 0) return false;
        
        const hasValidInstallment = tPlans.some(plan => {
          return (plan.installments || []).some((inst: any) => {
            if (!inst.date) return false;
            const instYmd = toCalendarYmd(inst.date);
            if (!instYmd) return false;
            if (paymentDateRange.startDate && instYmd < paymentDateRange.startDate) return false;
            if (paymentDateRange.endDate && instYmd > paymentDateRange.endDate) return false;
            return true;
          });
        });
        
        if (!hasValidInstallment) return false;
      }`;
      
  content = content.replace(filterBlockOld, filterBlockNew);
  
  // Header filter inputs
  const headerInputsOld = `            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Uçuş Tarihi"
                startValue={departureDateRange.startDate}
                endValue={departureDateRange.endDate}
                onStartChange={(v) => setDepartureDateRange(prev => ({ ...prev, startDate: v }))}
                onEndChange={(v) => setDepartureDateRange(prev => ({ ...prev, endDate: v }))}
                onApply={() => setPage(1)}
              />
            </div>`;
            
  const headerInputsNew = `            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Ödeme Tarihi"
                startValue={paymentDateRange.startDate}
                endValue={paymentDateRange.endDate}
                onStartChange={(v) => setPaymentDateRange(prev => ({ ...prev, startDate: v }))}
                onEndChange={(v) => setPaymentDateRange(prev => ({ ...prev, endDate: v }))}
                onApply={() => setPage(1)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Uçuş Tarihi"
                startValue={departureDateRange.startDate}
                endValue={departureDateRange.endDate}
                onStartChange={(v) => setDepartureDateRange(prev => ({ ...prev, startDate: v }))}
                onEndChange={(v) => setDepartureDateRange(prev => ({ ...prev, endDate: v }))}
                onApply={() => setPage(1)}
              />
            </div>`;
            
  content = content.replace(headerInputsOld, headerInputsNew);
  
  // Clear filter
  content = content.replace(
    `setDepartureDateRange({ startDate: '', endDate: '' })`,
    `setDepartureDateRange({ startDate: '', endDate: '' }); setPaymentDateRange({ startDate: '', endDate: '' })`
  );
}

// 3. Modernize Buttons
content = content.replace(
  /className="bg-blue-600 text-white px-3 py-1\.5 rounded text-xs hover:bg-blue-700 transition-colors font-medium"/g,
  'className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide hover:bg-blue-500/30 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]"'
);

content = content.replace(
  /className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors font-medium"/g,
  'className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-blue-500/30 transition-all duration-300"'
);

content = content.replace(
  /className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors font-medium"/g,
  'className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-emerald-500/30 transition-all duration-300"'
);

content = content.replace(
  /className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors font-medium"/g,
  'className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-red-500/30 transition-all duration-300"'
);

fs.writeFileSync('src/app/tickets/payments/page.tsx', content, 'utf8');

console.log("Minor updates applied successfully.");
