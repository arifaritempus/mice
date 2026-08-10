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
  async getStatement(entityName: string): Promise<StatementItem[]> {
    const items: StatementItem[] = [];
    
    // 1. Find if entityName is an agency
    const { data: agencies } = await supabase.from('agencies').select('id, name').ilike('name', entityName);
    const agencyId = agencies && agencies.length > 0 ? agencies[0].id : null;
    
    // 2. Fetch Projects
    let pQuery = supabase
      .from('projects')
      .select('id, agency_id, company_name, end_date, created_at, reference, name')
      .in('status', ['active', 'approved', 'completed']);
      
    if (agencyId) {
      pQuery = pQuery.or(`agency_id.eq.${agencyId},company_name.ilike.%${entityName}%`);
    } else {
      pQuery = pQuery.ilike('company_name', `%${entityName}%`);
    }
    
    const { data: projects, error: pErr } = await pQuery;
    if (pErr) console.error("Error fetching projects for statement:", pErr);
    
    const projectIds = (projects || []).map((p: any) => p.id);
    
    if (projectIds.length > 0) {
      // Project Sales
      const { data: pSales } = await supabase.from('project_sales_items').select('project_id, total_price, currency').in('project_id', projectIds);
      const pSalesMap: Record<string, Record<string, number>> = {};
      (pSales || []).forEach((s: any) => {
        const c = s.currency || 'TRY';
        if (!pSalesMap[s.project_id]) pSalesMap[s.project_id] = {};
        pSalesMap[s.project_id][c] = (pSalesMap[s.project_id][c] || 0) + Number(s.total_price || 0);
      });
      
      // Project Collections
      const { data: pCollections } = await supabase.from('project_collections').select('id, project_id, amount, currency, collection_date, created_at, notes, payment_method').in('project_id', projectIds);
      
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
                description: `[MICE] ${p.reference || p.name || 'Proje'}`,
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
          const refName = p ? (p.reference || p.name || 'Proje') : 'Proje';
          items.push({
            id: `p_coll_${c.id}`,
            date: c.collection_date || c.created_at,
            type: 'PAYMENT',
            module: 'PROJECT',
            referenceId: c.project_id,
            description: `[MICE] ${refName} Tahsilat${c.payment_method ? ` (${c.payment_method})` : ''}`,
            amount: Number(c.amount),
            currency: c.currency || 'TRY',
            createdAt: c.created_at
          });
        }
      });
    }
    
    // 3. Fetch Sejours
    let sQuery = supabase
      .from('sejours')
      .select('id, agency_id, customer_name, check_out_date, created_at, voucher_number, status');
      
    if (agencyId) {
      sQuery = sQuery.or(`agency_id.eq.${agencyId},customer_name.ilike.%${entityName}%`);
    } else {
      sQuery = sQuery.ilike('customer_name', `%${entityName}%`);
    }
    
    const { data: allSejours, error: sErr } = await sQuery;
    if (sErr) console.error("Error fetching sejours for statement:", sErr);
    
    const sejours = (allSejours || []).filter(s => {
      const st = (s.status || "").toLowerCase();
      if (st.includes("bekle") || st.includes("iptal")) return false;
      return st.includes("konfirme") || st.includes("tamam") || st.includes("onay") || st.includes("active");
    });
    
    const sejourIds = (sejours || []).map((s: any) => s.id);
    
    if (sejourIds.length > 0) {
      const { data: sRooms } = await supabase.from('sejour_rooms').select('sejour_id, total_price, price, currency').in('sejour_id', sejourIds);
      const { data: sFlights } = await supabase.from('sejour_flights').select('sejour_id, total_price, price, currency').in('sejour_id', sejourIds);
      const { data: sTransfers } = await supabase.from('sejour_transfers').select('sejour_id, total_price, price, currency').in('sejour_id', sejourIds);
      const { data: sExtras } = await supabase.from('sejour_extra_services').select('sejour_id, total_price, price, currency').in('sejour_id', sejourIds);
      
      const sSalesMap: Record<string, Record<string, number>> = {};
      const addSales = (arr: any[]) => {
        (arr || []).forEach(item => {
          const c = item.currency || 'TRY';
          if (!sSalesMap[item.sejour_id]) sSalesMap[item.sejour_id] = {};
          sSalesMap[item.sejour_id][c] = (sSalesMap[item.sejour_id][c] || 0) + Number(item.total_price || item.price || 0);
        });
      };
      
      addSales(sRooms);
      addSales(sFlights);
      addSales(sTransfers);
      addSales(sExtras);
      
      const { data: sCollections } = await supabase.from('sejour_collections').select('id, sejour_id, amount, currency, collection_date, created_at, notes, payment_method').in('sejour_id', sejourIds);
      
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
                description: `[SEJOUR] ${s.voucher_number || s.customer_name || 'Rezervasyon'}`,
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
          items.push({
            id: `s_coll_${c.id}`,
            date: c.collection_date || c.created_at,
            type: 'PAYMENT',
            module: 'SEJOUR',
            referenceId: c.sejour_id,
            description: `[SEJOUR] ${refName} Tahsilat${c.payment_method ? ` (${c.payment_method})` : ''}`,
            amount: Number(c.amount),
            currency: c.currency || 'TRY',
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
