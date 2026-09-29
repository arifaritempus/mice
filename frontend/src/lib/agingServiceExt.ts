import { supabase } from "./supabase";

export interface StatementItem {
  id: string;
  date: string;
  type: 'SALE' | 'PAYMENT';
  module: 'PROJECT' | 'SEJOUR';
  referenceId: string;
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export const agingServiceExt = {
  
  async getDebtStatement(entityName: string): Promise<StatementItem[]> {
    const items: StatementItem[] = [];
    
    // 1. Resolve Supplier / Hotel ID
    const { data: suppliers } = await supabase.from('suppliers').select('id').eq('name', entityName);
    const { data: hotels } = await supabase.from('hotels').select('id').eq('name', entityName);
    
    const supplierIds = [
      ...(suppliers || []).map(s => s.id),
      ...(hotels || []).map(h => h.id)
    ];
    
    if (supplierIds.length === 0) return items;

    // PROJECT PURCHASES & PAYMENTS
    const { data: pPurchases } = await supabase.from('project_purchase_items').select('project_id, total_price, currency, created_at, supplier_id, hotel_id');
    const { data: pPayments } = await supabase.from('project_payments').select('id, project_id, amount, currency, date, created_at, description, payment_type, payee, supplier_id, hotel_id');
    
    // We need project details to get names and dates
    const { data: projects } = await supabase.from('projects').select('id, title, end_date');
    const projectMap = (projects || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

    // Filter project items for our supplier
    const pPurchasesFiltered = (pPurchases || []).filter(p => supplierIds.includes(p.supplier_id) || supplierIds.includes(p.hotel_id));
    const pPaymentsFiltered = (pPayments || []).filter(p => supplierIds.includes(p.supplier_id) || supplierIds.includes(p.hotel_id));

    pPurchasesFiltered.forEach(p => {
      const amount = Number(p.total_price || 0);
      if (amount > 0) {
        const proj = projectMap[p.project_id];
        const date = proj?.end_date || p.created_at;
        items.push({
          id: `p_purch_${Math.random().toString(36).substring(7)}`,
          date: date,
          type: 'SALE', // We map purchases as 'SALE' in the statement context to show debt
          module: 'PROJECT',
          referenceId: p.project_id,
          description: `[MICE] ${proj?.title || 'Proje'} - Alış Tutarı`,
          amount: amount,
          currency: (p.currency === 'TL' ? 'TRY' : p.currency) || 'TRY',
          createdAt: p.created_at
        });
      }
    });

    pPaymentsFiltered.forEach(p => {
      const amount = Number(p.amount || 0);
      if (amount > 0) {
        const proj = projectMap[p.project_id];
        let detail = "";
        if (p.payment_type) detail += ` (${p.payment_type})`;
        if (p.description) detail += ` - ${p.description}`;
        
        items.push({
          id: `p_pay_${p.id}`,
          date: p.date || p.created_at,
          type: 'PAYMENT',
          module: 'PROJECT',
          referenceId: p.project_id,
          description: `[MICE] ${proj?.title || 'Proje'} Ödeme${detail}`,
          amount: amount,
          currency: (p.currency === 'TL' ? 'TRY' : p.currency) || 'TRY',
          createdAt: p.created_at
        });
      }
    });

    // SEJOUR PURCHASES & PAYMENTS
    const { data: sejours } = await supabase.from('sejours').select('id, voucher_number, customer_name, check_out_date');
    const sejourMap = (sejours || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

    const fetchSejourItems = async (table, costField) => {
      const { data } = await supabase.from(table).select(`sejour_id, ${costField}, costCurrency, supplierId, created_at, hotelId`);
      return (data || []).filter(d => supplierIds.includes(d.supplierId) || (d.hotelId && supplierIds.includes(d.hotelId)));
    };

    const sRooms = await fetchSejourItems('sejour_rooms', 'costPrice');
    const sFlights = await fetchSejourItems('sejour_flights', 'costPrice');
    const sTransfers = await fetchSejourItems('sejour_transfers', 'costPrice');
    const sExtras = await fetchSejourItems('sejour_extra_services', 'costPrice');
    
    const allSejourPurchases = [...sRooms, ...sFlights, ...sTransfers, ...sExtras];
    
    allSejourPurchases.forEach(s => {
      const amount = Number(s.costPrice || 0);
      if (amount > 0) {
        const sej = sejourMap[s.sejour_id];
        const date = sej?.check_out_date || s.created_at;
        items.push({
          id: `s_purch_${Math.random().toString(36).substring(7)}`,
          date: date,
          type: 'SALE', // Treat as invoice/debt generated
          module: 'SEJOUR',
          referenceId: s.sejour_id,
          description: `[SEJOUR] ${sej?.voucher_number || sej?.customer_name || 'Rezervasyon'} - Alış Tutarı`,
          amount: amount,
          currency: (s.costCurrency === 'TL' ? 'TRY' : s.costCurrency) || 'TRY',
          createdAt: s.created_at
        });
      }
    });

    const { data: sPaymentsData } = await supabase.from('sejour_payments').select('id, sejour_id, amount, currency, date, created_at, description, payment_type, supplierId');
    const sPaymentsFiltered = (sPaymentsData || []).filter(p => supplierIds.includes(p.supplierId));

    sPaymentsFiltered.forEach(p => {
      const amount = Number(p.amount || 0);
      if (amount > 0) {
        const sej = sejourMap[p.sejour_id];
        let detail = "";
        if (p.payment_type) detail += ` (${p.payment_type})`;
        if (p.description) detail += ` - ${p.description}`;
        
        items.push({
          id: `s_pay_${p.id}`,
          date: p.date || p.created_at,
          type: 'PAYMENT',
          module: 'SEJOUR',
          referenceId: p.sejour_id,
          description: `[SEJOUR] ${sej?.voucher_number || sej?.customer_name || 'Rezervasyon'} Ödeme${detail}`,
          amount: amount,
          currency: (p.currency === 'TL' ? 'TRY' : p.currency) || 'TRY',
          createdAt: p.created_at
        });
      }
    });

    // Sort items by date ascending (oldest first)
    items.sort((a, b) => {
      const dA = new Date(a.date || a.createdAt).getTime();
      const dB = new Date(b.date || b.createdAt).getTime();
      if (dA === dB) {
          if (a.type === 'SALE' && b.type === 'PAYMENT') return -1;
          if (a.type === 'PAYMENT' && b.type === 'SALE') return 1;
          return 0;
      }
      return dA - dB;
    });

    return items;
  },

  async getStatement(entityName: string): Promise<StatementItem[]> {
    const items: StatementItem[] = [];
    
    // 1. Find if entityName is an agency
    const { data: agencies } = await supabase.from('agencies').select('id, name').ilike('name', entityName);
    const agencyId = agencies && agencies.length > 0 ? agencies[0].id : null;
    
    let projects: any[] = [];
    
    if (agencyId) {
      const { data: pData1, error: pErr1 } = await supabase
        .from('projects')
        .select('id, agency_id, company_name, end_date, created_at, title')
        .in('status', ['active', 'approved', 'completed'])
        .eq('agency_id', agencyId);
      if (pErr1) console.error("Error fetching projects by agency_id:", pErr1);
      if (pData1) projects.push(...pData1);
    }
    
    const { data: pData2, error: pErr2 } = await supabase
      .from('projects')
      .select('id, agency_id, company_name, end_date, created_at, title')
      .in('status', ['active', 'approved', 'completed'])
      .eq('company_name', entityName);
    if (pErr2) console.error("Error fetching projects by company_name:", pErr2);
    if (pData2) projects.push(...pData2);
    
    projects = Array.from(new Map(projects.map(p => [p.id, p])).values());
    
    const projectIds = (projects || []).map((p: any) => p.id);
    
    if (projectIds.length > 0) {
      // Project Sales
      const { data: pSales } = await supabase.from('project_sales_items').select('project_id, total_price, currency').in('project_id', projectIds);
      const pSalesMap: Record<string, Record<string, number>> = {};
      (pSales || []).forEach((s: any) => {
        const c = (s.currency === 'TL' ? 'TRY' : s.currency) || 'TRY';
        if (!pSalesMap[s.project_id]) pSalesMap[s.project_id] = {};
        pSalesMap[s.project_id][c] = (pSalesMap[s.project_id][c] || 0) + Number(s.total_price || 0);
      });
      
      // Project Collections
      const { data: pCollections, error: pCollErr } = await supabase.from('project_collections').select('id, project_id, amount, currency, date, created_at, description, collection_type').in('project_id', projectIds);
      if (pCollErr) console.error("Error fetching project collections:", pCollErr);
      
      (projects || []).forEach((p: any) => {
        // Add Sales Items
        const sales = pSalesMap[p.id];
        if (sales) {
          Object.keys(sales).forEach(currency => {
            const amount = sales[currency];
            if (amount > 0) {
              items.push({
                id: `p_sale_${p.id}_${currency}`,
                date: p.end_date || p.created_at,
                type: 'SALE',
                module: 'PROJECT',
                referenceId: p.id,
                description: `[MICE] ${p.title || 'Proje'} - Satış Tutarı`,
                amount: amount,
                currency: currency,
                createdAt: p.created_at
              });
            }
          });
        }
      });
      
      (pCollections || []).forEach((c: any) => {
        if (c.amount > 0) {
          const p = projects?.find((proj: any) => proj.id === c.project_id);
          const refName = p ? (p.title || 'Proje') : 'Proje';
          const currency = (c.currency === 'TL' ? 'TRY' : c.currency) || 'TRY';
          
          let paymentDetail = "";
          if (c.collection_type) paymentDetail += ` (${c.collection_type})`;
          if (c.description) paymentDetail += ` - ${c.description}`;
          
          items.push({
            id: `p_coll_${c.id}`,
            date: c.date || c.created_at,
            type: 'PAYMENT',
            module: 'PROJECT',
            referenceId: c.project_id,
            description: `[MICE] ${refName} Tahsilat${paymentDetail}`,
            amount: Number(c.amount),
            currency: currency,
            createdAt: c.created_at
          });
        }
      });
    }
    
    let allSejours: any[] = [];
    
    if (agencyId) {
      const { data: sData1, error: sErr1 } = await supabase
        .from('sejours')
        .select('id, agency_id, customer_name, check_out_date, created_at, voucher_number, status')
        .eq('agency_id', agencyId);
      if (sErr1) console.error("Error fetching sejours by agency_id:", sErr1);
      if (sData1) allSejours.push(...sData1);
    }
    
    const { data: sData2, error: sErr2 } = await supabase
      .from('sejours')
      .select('id, agency_id, customer_name, check_out_date, created_at, voucher_number, status')
      .eq('customer_name', entityName);
    if (sErr2) console.error("Error fetching sejours by customer_name:", sErr2);
    if (sData2) allSejours.push(...sData2);
    
    allSejours = Array.from(new Map(allSejours.map(s => [s.id, s])).values());
    
    const sejours = (allSejours || []).filter(s => {
      const st = (s.status || "").toLowerCase();
      if (st.includes("bekle") || st.includes("iptal")) return false;
      return st.includes("konfirme") || st.includes("tamam") || st.includes("onay") || st.includes("active");
    });
    
    const sejourIds = (sejours || []).map((s: any) => s.id);
    
    if (sejourIds.length > 0) {
      const { data: sRooms } = await supabase.from('sejour_rooms').select('sejour_id, total_price, currency').in('sejour_id', sejourIds);
      const { data: sFlights } = await supabase.from('sejour_flights').select('sejour_id, total_price, currency').in('sejour_id', sejourIds);
      const { data: sTransfers } = await supabase.from('sejour_transfers').select('sejour_id, price, currency').in('sejour_id', sejourIds);
      const { data: sExtras } = await supabase.from('sejour_extra_services').select('sejour_id, price, currency').in('sejour_id', sejourIds);
      
      const sSalesMap: Record<string, Record<string, number>> = {};
      const addSales = (arr: any[]) => {
        (arr || []).forEach(item => {
          const c = (item.currency === 'TL' ? 'TRY' : item.currency) || 'TRY';
          if (!sSalesMap[item.sejour_id]) sSalesMap[item.sejour_id] = {};
          sSalesMap[item.sejour_id][c] = (sSalesMap[item.sejour_id][c] || 0) + Number(item.total_price || item.price || 0);
        });
      };
      
      addSales(sRooms);
      addSales(sFlights);
      addSales(sTransfers);
      addSales(sExtras);
      
      const { data: sCollections, error: sCollErr } = await supabase.from('sejour_collections').select('id, sejour_id, amount, currency, collection_date, created_at, description, payment_method').in('sejour_id', sejourIds);
      if (sCollErr) console.error("Error fetching sejour collections:", sCollErr);
      
      (sejours || []).forEach((s: any) => {
        const sales = sSalesMap[s.id];
        if (sales) {
          Object.keys(sales).forEach(currency => {
            const amount = sales[currency];
            if (amount > 0) {
              items.push({
                id: `s_sale_${s.id}_${currency}`,
                date: s.check_out_date || s.created_at,
                type: 'SALE',
                module: 'SEJOUR',
                referenceId: s.id,
                description: `[SEJOUR] ${s.voucher_number || s.customer_name || 'Rezervasyon'} - Satış Tutarı`,
                amount: amount,
                currency: currency,
                createdAt: s.created_at
              });
            }
          });
        }
      });
      
      (sCollections || []).forEach((c: any) => {
        if (c.amount > 0) {
          const s = sejours?.find((sej: any) => sej.id === c.sejour_id);
          const refName = s ? (s.voucher_number || s.customer_name || 'Rezervasyon') : 'Rezervasyon';
          const currency = (c.currency === 'TL' ? 'TRY' : c.currency) || 'TRY';
          
          let paymentDetail = "";
          if (c.payment_method) paymentDetail += ` (${c.payment_method})`;
          if (c.description) paymentDetail += ` - ${c.description}`;
          
          items.push({
            id: `s_coll_${c.id}`,
            date: c.collection_date || c.created_at,
            type: 'PAYMENT',
            module: 'SEJOUR',
            referenceId: c.sejour_id,
            description: `[SEJOUR] ${refName} Tahsilat${paymentDetail}`,
            amount: Number(c.amount),
            currency: currency,
            createdAt: c.created_at
          });
        }
      });
    }
    
    // Sort items by date ascending (oldest first)
    items.sort((a, b) => {
      const dA = new Date(a.date || a.createdAt).getTime();
      const dB = new Date(b.date || b.createdAt).getTime();
      if (dA === dB) {
          // if same date, SALES come before PAYMENTS
          if (a.type === 'SALE' && b.type === 'PAYMENT') return -1;
          if (a.type === 'PAYMENT' && b.type === 'SALE') return 1;
          return 0;
      }
      return dA - dB;
    });
    
    return items;
  }
};
