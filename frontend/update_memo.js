const fs = require('fs');

const code = `const m = useMemo(() => {
    const range = getPeriodRange(period, customDate.start, customDate.end);

    // Filtering base data
    const fProj = data.rpProjectRows.filter((r: any) =>
      inRange(r.organizasyon_tarihi || r.created_at, range),
    );
    const fSej = data.rpSejourRows.filter((r: any) =>
      inRange(r.giris_tarihi || r.created_at, range),
    );
    const fCols = data.collectionPlans.filter((c: any) =>
      inRange(c.due_date || c.date, range),
    );
    const fPays = data.paymentPlans.filter((p: any) =>
      inRange(p.due_date || p.date, range),
    );
    const fQts = data.quotes.filter((q: any) =>
      inRange(q.created_at || q.option_date, range),
    );
    const fTransfers = data.transfers.filter((t: any) =>
      inRange(t.transfer_date || t.created_at, range),
    );
    const fFlights = data.flights.filter((f: any) =>
      inRange(f.gidis_tarihi || f.created_at, range),
    );
    const fHr = data.hrRows.filter((h: any) =>
      inRange(h.start_date || h.created_at, range),
    );
    const fEvents = data.events.filter((e: any) =>
      inRange(e.event_date || e.created_at, range),
    );
    const fMkt = data.marketingInteractions.filter((m: any) =>
      inRange(m.created_at || m.date, range),
    );
    const fAccs = (data.accommodations || []).filter((a: any) =>
      inRange(a.check_in_date || a.created_at, range),
    );

    // KPI: Revenues
    const miceRev = fProj.reduce(
      (acc: number, p: any) => acc + (Number(p.satis_tl) || 0),
      0,
    );
    const miceCost = fProj.reduce(
      (acc: number, p: any) => acc + (Number(p.maliyet_tl) || 0),
      0,
    );
    const sejRev = fSej.reduce(
      (acc: number, s: any) => acc + (Number(s.satis_tl) || 0),
      0,
    );
    const sejCost = fSej.reduce(
      (acc: number, s: any) => acc + (Number(s.maliyet_tl) || 0),
      0,
    );
    
    // BILET CIRO
    const projFlightRev = fFlights.reduce((acc: number, f: any) => acc + (Number(f.satis_fiyati) || Number(f.total_amount) || 0), 0);
    const sejFlightRev = data.sejours.filter((s: any) => inRange(s.checkInDate || s.created_at, range)).reduce((acc: number, s: any) => {
      let flightsTotal = 0;
      if (s.flights && Array.isArray(s.flights)) {
        flightsTotal = s.flights.reduce((sum: number, f: any) => sum + (Number(f.satis_fiyati) || Number(f.total_amount) || 0), 0);
      }
      return acc + flightsTotal;
    }, 0);
    const flightRev = projFlightRev + sejFlightRev;

    const eventRev = fEvents.reduce(
      (acc: number, e: any) =>
        acc +
        (Number(e.total_tl) ||
          Number(e.total_price) ||
          Number(e.satis_fiyati) ||
          0),
      0,
    );

    const totalRev = miceRev + sejRev + flightRev + eventRev;
    const totalCost = miceCost + sejCost; // Assuming flights/events cost might be mapped if needed, or included in projects.
    const totalProfit = totalRev - totalCost;

    // Funnel Data
    const meetingEmails = fMkt.filter((m: any) => {
      const type = (m.interaction_type || m.type || "").toLowerCase();
      return type.includes("toplant") || type.includes("mail") || type.includes("e-posta");
    });
    // Use Set to count unique companies
    const uniqueInteractedCompanies = new Set(meetingEmails.map((m: any) => m.company_id || m.agency_id).filter(Boolean)).size;
    const totalMkt = uniqueInteractedCompanies > 0 ? uniqueInteractedCompanies : meetingEmails.length;

    const pendingQuotesArr = fQts.filter((q: any) => (q.status || "").toLowerCase() === "pending" || (q.status || "").toLowerCase() === "beklemede");
    const pendingQts = pendingQuotesArr.length;
    const pendingQtsValue = pendingQuotesArr.reduce((acc: number, q: any) => acc + (Number(q.total_amount) || Number(q.amount) || 0), 0);

    const wonQts = fQts.filter(
      (q: any) =>
        (q.status || "").toLowerCase().includes("konfirme") ||
        (q.status || "").toLowerCase() === "won",
    ).length;

    const funnelData = [
      {
        name: "Etkileşim (Toplantı/Mail)",
        value: totalMkt,
        fill: "#8b5cf6",
      },
      { name: "Oluşturulan Teklif", value: pendingQts, fill: "#3b82f6" },
      { name: "Kazanılan Proje", value: wonQts, fill: "#10b981" },
    ];

    // Agency Analysis
    const agnMap: Record<
      string,
      { name: string; ciro: number; maliyet: number }
    > = {};
    
    const getAgencyName = (id: string, fallback: string) => {
      if (!id) return fallback;
      const found = data.agencies.find((a: any) => a.id === id);
      return found ? found.name : fallback;
    };

    fProj.forEach((p: any) => {
      const a = getAgencyName(p.agency_id, p.musteri_adi || p.acente_adi || "Bilinmeyen Acente");
      if (!agnMap[a]) agnMap[a] = { name: a, ciro: 0, maliyet: 0 };
      agnMap[a].ciro += Number(p.satis_tl) || 0;
      agnMap[a].maliyet += Number(p.maliyet_tl) || 0;
    });
    fSej.forEach((s: any) => {
      const a = getAgencyName(s.agency_id, s.acente_adi || s.musteri_adi || "Bilinmeyen Acente");
      if (!agnMap[a]) agnMap[a] = { name: a, ciro: 0, maliyet: 0 };
      agnMap[a].ciro += Number(s.satis_tl) || 0;
      agnMap[a].maliyet += Number(s.maliyet_tl) || 0;
    });
    const agencyData = Object.values(agnMap)
      .map((a) => ({
        name: a.name,
        Ciro: a.ciro,
        Maliyet: a.maliyet,
        "Kar/Zarar": a.ciro - a.maliyet,
        Marj: a.ciro > 0 ? Math.round(((a.ciro - a.maliyet) / a.ciro) * 100) : 0,
      }))
      .sort((a, b) => b.Ciro - a.Ciro)
      .slice(0, 10);

    // Hotel Analysis
    const htlMap: Record<string, { ciro: number; maliyet: number }> = {};
    const getHotelName = (id: string, fallback: string) => {
      if (!id) return fallback;
      const found = data.hotels.find((h: any) => h.id === id);
      return found ? found.name : fallback;
    };
    fSej.forEach((s: any) => {
      const h = getHotelName(s.hotel_id, s.hotel_name || s.hotelName || "Bilinmeyen Otel");
      if (!htlMap[h]) htlMap[h] = { ciro: 0, maliyet: 0 };
      htlMap[h].ciro += (Number(s.satis_tl) || 0);
      htlMap[h].maliyet += (Number(s.maliyet_tl) || 0);
    });
    fAccs.forEach((a: any) => {
      const h = getHotelName(a.hotel_id, a.hotel_name || "Bilinmeyen Otel");
      if (!htlMap[h]) htlMap[h] = { ciro: 0, maliyet: 0 };
      htlMap[h].ciro += (Number(a.satis_fiyati) || Number(a.total_amount) || 0);
      htlMap[h].maliyet += (Number(a.maliyet) || 0);
    });
    const hotelData = Object.keys(htlMap)
      .map((k) => ({ 
        name: k, 
        Satış: htlMap[k].ciro,
        Maliyet: htlMap[k].maliyet,
        "Kar/Zarar": htlMap[k].ciro - htlMap[k].maliyet,
        Marj: htlMap[k].ciro > 0 ? Math.round(((htlMap[k].ciro - htlMap[k].maliyet) / htlMap[k].ciro) * 100) : 0
      }))
      .sort((a, b) => b.Satış - a.Satış)
      .slice(0, 10);

    // Airline Distribution
    const airMap: Record<string, number> = {};
    fFlights.forEach((f: any) => {
      const a = f.airline || f.havayolu || "Diğer";
      airMap[a] = (airMap[a] || 0) + 1;
    });
    const airlineData = Object.keys(airMap)
      .map((k) => ({ name: k, Adet: airMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // Vehicle Types
    const vehMap: Record<string, number> = {};
    fTransfers.forEach((t: any) => {
      const v = t.vehicle_type || t.arac_tipi || "Diğer";
      vehMap[v] = (vehMap[v] || 0) + 1;
    });
    const vehicleData = Object.keys(vehMap)
      .map((k) => ({ name: k, Adet: vehMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // HR Types
    const hrMap: Record<string, number> = {};
    fHr.forEach((h: any) => {
      const r = h.role || h.personnel_type || h.type || "Diğer";
      hrMap[r] = (hrMap[r] || 0) + 1;
    });
    const hrData = Object.keys(hrMap)
      .map((k) => ({ name: k, Adet: hrMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // New Chart: Project Efficiency
    const projectEfficiencyData = fProj.map((p: any) => {
      const c = Number(p.satis_tl) || 0;
      const m = Number(p.maliyet_tl) || 0;
      return {
        name: p.proje_adi || p.code || "Proje",
        Ciro: c,
        Maliyet: m,
        "Kar/Zarar": c - m,
        Marj: c > 0 ? Math.round(((c - m) / c) * 100) : 0
      };
    }).sort((a: any, b: any) => b.Ciro - a.Ciro).slice(0, 15);

    // New Chart: Sejour Efficiency
    const sejourEfficiencyData = fSej.filter((s: any) => (s.status || "").toLowerCase() === "confirmed").map((s: any) => {
      const c = Number(s.satis_tl) || 0;
      const m = Number(s.maliyet_tl) || 0;
      return {
        name: s.file_number || s.guestInfo || "Sejour",
        Ciro: c,
        Maliyet: m,
        "Kar/Zarar": c - m,
        Marj: c > 0 ? Math.round(((c - m) / c) * 100) : 0
      };
    }).sort((a: any, b: any) => b.Ciro - a.Ciro).slice(0, 15);

    // New Chart: Transfer Suppliers
    const getSupplierName = (id: string, fallback: string) => {
      if (!id) return fallback;
      const found = data.suppliers.find((s: any) => s.id === id);
      return found ? found.name : fallback;
    };
    const supMap: Record<string, number> = {};
    fTransfers.forEach((t: any) => {
      const s = getSupplierName(t.supplier_id, "Bilinmeyen Tedarikçi");
      supMap[s] = (supMap[s] || 0) + 1;
    });
    const transferSupplierData = Object.keys(supMap)
      .map((k) => ({ name: k, Adet: supMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // Operational Flow (Upcoming Confirmed)
    const upcomingOps: any[] = [];
    const now = new Date();
    data.flights
      .filter(
        (f: any) =>
          ((f.status || "").toLowerCase() === "confirmed" || (f.status || "").toLowerCase() === "ok") &&
          parseDateSafe(f.gidis_tarihi) &&
          parseDateSafe(f.gidis_tarihi)! >= now,
      )
      .forEach((f: any) =>
        upcomingOps.push({
          type: "Uçuş",
          date: parseDateSafe(f.gidis_tarihi),
          title: f.airline || "Uçuş",
          detail: f.pnr || "-",
        }),
      );
    data.transfers
      .filter(
        (t: any) =>
          ((t.status || "").toLowerCase() === "confirmed" || (t.status || "").toLowerCase() === "ok") &&
          parseDateSafe(t.transfer_date) &&
          parseDateSafe(t.transfer_date)! >= now,
      )
      .forEach((t: any) =>
        upcomingOps.push({
          type: "Transfer",
          date: parseDateSafe(t.transfer_date),
          title: t.vehicle_type || "Transfer",
          detail: t.route || "-",
        }),
      );
    data.sejours
      .filter(
        (s: any) =>
          (s.status || "").toLowerCase() === "confirmed" &&
          parseDateSafe(s.checkInDate) && parseDateSafe(s.checkInDate)! >= now,
      )
      .forEach((s: any) =>
        upcomingOps.push({
          type: "Sejour C-In",
          date: parseDateSafe(s.checkInDate),
          title: s.hotelName || "Otel",
          detail: s.guestInfo || "-",
        }),
      );
    data.accommodations
      .filter(
        (a: any) =>
          ((a.status || "").toLowerCase() === "confirmed" || (a.status || "").toLowerCase() === "ok") &&
          parseDateSafe(a.check_in_date) && parseDateSafe(a.check_in_date)! >= now,
      )
      .forEach((a: any) =>
        upcomingOps.push({
          type: "Proje Otel C-In",
          date: parseDateSafe(a.check_in_date),
          title: getHotelName(a.hotel_id, "Otel"),
          detail: a.room_type || "-",
        }),
      );

    upcomingOps.sort((a, b) => a.date.getTime() - b.date.getTime());
    const topOps = upcomingOps.slice(0, 10);

    return {
      totalRev,
      totalCost,
      totalProfit,
      flightRev,
      eventRev,
      funnelData,
      totalMkt,
      pendingQts,
      pendingQtsValue,
      wonQts,
      agencyData,
      hotelData,
      airlineData,
      vehicleData,
      hrData,
      projectEfficiencyData,
      sejourEfficiencyData,
      transferSupplierData,
      topOps,
    };
  }, [
    period,
    customDate,
    data.rpProjectRows,
    data.rpSejourRows,
    data.collectionPlans,
    data.paymentPlans,
    data.marketingInteractions,
    data.quotes,
    data.transfers,
    data.flights,
    data.hrRows,
    data.events,
    data.agencies,
    data.hotels,
    data.sejours,
    data.suppliers,
    data.accommodations,
  ]);
`;
fs.writeFileSync('new_memo.txt', code);
console.log("Wrote new_memo.txt");

let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const start = pageContent.indexOf('const m = useMemo(() => {');
const end = pageContent.indexOf('return {', start) + 'return {'.length;
// Wait, I need the end of the useMemo which is `  ]);`
const useMemoRegex = /const m = useMemo\(\(\) => \{[\s\S]*?\}, \[[^\]]*\]\);/;
if (useMemoRegex.test(pageContent)) {
  pageContent = pageContent.replace(useMemoRegex, code);
  fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
  console.log("Replaced successfully!");
} else {
  console.log("Regex did not match!");
}
