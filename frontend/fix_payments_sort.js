const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/payments/page.tsx', 'utf8');

// 1. Move Ödeme Tarihi button before Uçuş Tarihi in the UI
const btnFlight = `<button onClick={() => setSortBy('flight')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${sortBy === 'flight' ? 'bg-blue-500/20 border border-blue-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>UÇUŞ TARİHİ</span>
            </button>`;

const btnPayment = `<button onClick={() => setSortBy('payment')} className={\`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 \${sortBy === 'payment' ? 'bg-emerald-500/20 border border-emerald-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}\`}>
              <span>ÖDEME TARİHİ</span>
            </button>`;

// Currently it's flight, payment, balance.
// Replace the exact sequence.
const oldBtns = btnFlight + `\n            ` + btnPayment;
const newBtns = btnPayment + `\n            ` + btnFlight;

content = content.replace(oldBtns, newBtns);

// 2. Update filteredTickets logic to apply sort
const oldBalanceFilter = `// Bakiyesi Olan filtresi: sadece bakiyesi > 0 olanları göster, sıralama yapma
    if (sortBy === 'balance') {
      return filtered.filter(t => getTicketRemainingAmount(t.id) > 0)
    }
    // Diğerleri: sıralama uygula
    return sortTickets(filtered)`;

const newBalanceFilter = `// Bakiyesi Olan filtresi: sadece bakiyesi > 0 olanları göster ve sırala
    if (sortBy === 'balance') {
      const withBalance = filtered.filter(t => getTicketRemainingAmount(t.id) > 0);
      return sortTickets(withBalance);
    }
    // Diğerleri: sıralama uygula
    return sortTickets(filtered)`;

content = content.replace(oldBalanceFilter, newBalanceFilter);

// 3. Update sortTickets logic for balance
const oldSortBalance = `} else {
      // Bakiyesi olan biletleri önce göster
      return [...tickets].sort((a, b) => {
        const aBalance = getTicketRemainingAmount(a.id);
        const bBalance = getTicketRemainingAmount(b.id);
        
        // Bakiyesi olan biletler önce (azalan sıra)
        if (aBalance > 0 && bBalance === 0) return -1;
        if (aBalance === 0 && bBalance > 0) return 1;
        
        // Her ikisi de bakiyeli ise büyük bakiye önce
        if (aBalance > 0 && bBalance > 0) {
          return bBalance - aBalance;
        }
        
        // Her ikisi de bakiyesiz ise uçuş tarihine göre
        const aDate = parseDate(a.departure_date || a.entry_date)
        const bDate = parseDate(b.departure_date || b.entry_date)
        if (!aDate && !bDate) return 0
        if (!aDate) return 1
        if (!bDate) return -1
        return aDate.getTime() - bDate.getTime()
      });
    }`;

const newSortBalance = `} else if (sortBy === 'balance') {
      // Bakiyesi olanları ödeme tarihine göre sırala
      return [...tickets].sort((a, b) => {
        const aPaymentPlan = paymentPlans.find(plan => plan.ticket_id === a.id)
        const bPaymentPlan = paymentPlans.find(plan => plan.ticket_id === b.id)
        const aFirst = parseDate(aPaymentPlan?.installments?.[0]?.date)
        const bFirst = parseDate(bPaymentPlan?.installments?.[0]?.date)
        if (!aFirst && !bFirst) return 0
        if (!aFirst) return 1
        if (!bFirst) return -1
        return aFirst.getTime() - bFirst.getTime()
      });
    }
    return tickets;`;

content = content.replace(oldSortBalance, newSortBalance);

fs.writeFileSync('src/app/tickets/payments/page.tsx', content, 'utf8');

console.log("Sort logic updated successfully.");
