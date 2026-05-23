import { createClient } from '@supabase/supabase-js';

// Servis rolü ile oluşturuyoruz ki her şeyi güncelleyebilsin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function updateProjectRates(projectId: string, strategy: string) {
  if (!projectId || !strategy) throw new Error('Missing projectId or strategy');

  // 1. Projeyi bul
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (pError || !project) throw new Error('Project not found');

  // Eğer proje başlamışsa (start_date bugün veya geçmişse) ve strateji zaten bir kur ise sabitlemişizdir.
  // Cron job bunu çağırdığında start_date'i geçmiş projeleri atlayacak ama manuel tetiklemede güncelleyebiliriz.

  // 2. Eğer manuel değilse, TCMB kurlarını al
  let usd_rate = 1, eur_rate = 1, gbp_rate = 1;

  if (strategy !== 'manuel') {
    // En son TCMB kur tarihini bul (bugün veya en son eklenen)
    const { data: latestDateObj } = await supabase
      .from('tcmb_kurlari')
      .select('tarih')
      .order('tarih', { ascending: false })
      .limit(1)
      .single();

    if (latestDateObj) {
      const { data: rates } = await supabase
        .from('tcmb_kurlari')
        .select('*')
        .eq('tarih', latestDateObj.tarih);

      if (rates && rates.length > 0) {
        // Hangi alanı okuyacağız?
        // tcmb_forex_buying -> forex_buying
        // tcmb_forex_selling -> forex_selling
        // tcmb_banknote_buying -> banknote_buying
        // tcmb_banknote_selling -> banknote_selling
        const fieldName = strategy.replace('tcmb_', ''); // forex_buying, vb.

        const getRate = (code: string) => {
          const r = rates.find((x: any) => x.kod === code);
          return r && r[fieldName] ? Number(r[fieldName]) : 1;
        };

        usd_rate = getRate('USD');
        eur_rate = getRate('EUR');
        gbp_rate = getRate('GBP');
      }
    }
  }

  // 3. Projeyi güncelle
  const updatePayload: any = { exchange_rate_strategy: strategy };
  if (strategy !== 'manuel') {
    updatePayload.usd_rate = usd_rate;
    updatePayload.eur_rate = eur_rate;
    updatePayload.gbp_rate = gbp_rate;
  }

  const { error: updateErr } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId);

  if (updateErr) throw updateErr;

  // 4. Strateji 'manuel' değilse, alt satırları (items) da bu kurlara göre güncelle
  if (strategy !== 'manuel') {
    const applyToTable = async (tableName: string, rateField: string, totalTryField: string, totalField: string, curField: string) => {
      const { data: items } = await supabase.from(tableName).select('id, ' + curField + ', ' + totalField).eq('project_id', projectId);
      if (!items || items.length === 0) return;

      for (const item of (items as any[])) {
        let newFx = 1;
        const cur = item[curField];
        if (cur === 'USD') newFx = usd_rate;
        else if (cur === 'EUR') newFx = eur_rate;
        else if (cur === 'GBP') newFx = gbp_rate;
        else if (cur === 'TRY' || cur === 'TL') newFx = 1;
        else continue; // Bilinmeyen döviz ise atla (ya da 1 kalsın)

        const totalValue = Number(item[totalField] || 0);
        const newTotalTry = totalValue * newFx;

        await supabase.from(tableName).update({
          [rateField]: newFx,
          [totalTryField]: newTotalTry
        }).eq('id', item.id);
      }
    };

    // Sales & Purchase
    await applyToTable('project_sales_items', 'fx', 'total_try', 'total_price', 'currency');
    await applyToTable('project_purchase_items', 'fx', 'total_try', 'total_price', 'currency');
    
    // Uçak Bileti
    await applyToTable('project_flight_tickets', 'kur', 'toplam_tl', 'toplam_maliyet', 'doviz');

    // Diğer Servisler vb. (Eğer `fx`, `total_try`, `total_price` yapısını kullanıyorlarsa)
    // Şema garantisi olmadığı için try-catch ile saralım ki hata olursa işlemi durdurmasın.
    const safeApply = async (table: string, r: string, tt: string, t: string, c: string) => {
      try { await applyToTable(table, r, tt, t, c); } catch (e) { console.error(`Error updating ${table}:`, e); }
    };

    await safeApply('project_events_activities', 'fx', 'total_try', 'total_price', 'currency');
    await safeApply('project_human_resources', 'fx', 'total_try', 'total_price', 'currency');
    await safeApply('project_other_services', 'fx', 'total_try', 'total_price', 'currency');
    await safeApply('project_financial_services', 'fx', 'total_try', 'total_price', 'currency');
    // Eğer transfer tablosu 'project_transfer_tour' ise:
    await safeApply('project_transfer_tour', 'fx', 'total_try', 'cost_amount', 'currency');
  }

  return { success: true, strategy, usd_rate, eur_rate, gbp_rate };
}
