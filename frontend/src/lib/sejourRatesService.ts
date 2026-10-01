import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ExchangeRatesResult {
  usd_rate: number;
  eur_rate: number;
  gbp_rate: number;
  rateDate?: string;
}

/**
 * Belirli bir tarih ve strateji için TCMB kurlarını Supabase veritabanından (tcmb_kurlari) çeker.
 * Dışarıya (TCMB'ye) doğrudan istek atmaz, ban riskini önler. Kurlar günlük cron tarafından tcmb_kurlari tablosuna kaydedilir.
 */
export async function getTcmbRatesForDate(
  targetDateStr?: string,
  strategy: string = 'tcmb_banknote_selling'
): Promise<ExchangeRatesResult> {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(now);
  const dateToUse = targetDateStr && targetDateStr <= todayStr ? targetDateStr : todayStr;

  if (strategy === 'manuel') {
    return { usd_rate: 1, eur_rate: 1, gbp_rate: 1, rateDate: dateToUse };
  }

  const fieldName = strategy.replace('tcmb_', ''); // banknote_selling, forex_buying, vb.

  try {
    // 1. Önce veritabanında hedef tarih veya öncesi var mı kontrol et
    const { data: latestDateObj } = await supabase
      .from('tcmb_kurlari')
      .select('tarih')
      .lte('tarih', dateToUse)
      .order('tarih', { ascending: false })
      .limit(1)
      .maybeSingle();

    let targetTarih = latestDateObj?.tarih;

    // 2. Eğer hedef tarihe eşit veya öncesinde kur yoksa, tablodaki en güncel tarihi al
    if (!targetTarih) {
      const { data: fallbackDateObj } = await supabase
        .from('tcmb_kurlari')
        .select('tarih')
        .order('tarih', { ascending: false })
        .limit(1)
        .maybeSingle();
      targetTarih = fallbackDateObj?.tarih;
    }

    if (targetTarih) {
      const { data: rates } = await supabase
        .from('tcmb_kurlari')
        .select('*')
        .eq('tarih', targetTarih);

      if (rates && rates.length > 0) {
        const getRate = (code: string) => {
          const r = rates.find((x: any) => x.kod === code);
          return r && r[fieldName] ? Number(r[fieldName]) : 1;
        };

        const usd = getRate('USD');
        const eur = getRate('EUR');
        const gbp = getRate('GBP');

        return {
          usd_rate: usd,
          eur_rate: eur,
          gbp_rate: gbp,
          rateDate: targetTarih,
        };
      }
    }
  } catch (err) {
    console.error('[Supabase tcmb_kurlari Read Error]:', err);
  }

  return { usd_rate: 1, eur_rate: 1, gbp_rate: 1, rateDate: dateToUse };
}

/**
 * Bir Sejour kaydının ve alt hizmetlerinin (Oda, Uçuş, Transfer, Ekstra Hizmet) kurlarını günceller.
 */
export async function updateSejourRates(
  sejourId: string,
  strategy: string,
  manualRates?: { usd_rate?: number; eur_rate?: number; gbp_rate?: number }
) {
  if (!sejourId || !strategy) throw new Error('Missing sejourId or strategy');

  // 1. Sejour'u bul
  const { data: sejour, error: sError } = await supabase
    .from('sejours')
    .select('*')
    .eq('id', sejourId)
    .single();

  if (sError || !sejour) throw new Error('Sejour not found');

  // 2. Kurları belirle
  let usd_rate = manualRates?.usd_rate ?? (Number(sejour.usd_rate) || 1);
  let eur_rate = manualRates?.eur_rate ?? (Number(sejour.eur_rate) || 1);
  let gbp_rate = manualRates?.gbp_rate ?? (Number(sejour.gbp_rate) || 1);

  if (strategy !== 'manuel') {
    const fetched = await getTcmbRatesForDate(sejour.check_in_date, strategy);
    usd_rate = fetched.usd_rate;
    eur_rate = fetched.eur_rate;
    gbp_rate = fetched.gbp_rate;
  }

  const getCurrencyFx = (cur: string | null | undefined): number => {
    if (!cur) return 1;
    const upper = cur.toUpperCase();
    if (upper === 'EUR') return eur_rate;
    if (upper === 'USD') return usd_rate;
    if (upper === 'GBP') return gbp_rate;
    return 1;
  };

  // 3. Alt tabloları güncelle ve konsolide TRY tutarlarını hesapla
  let totalSalesTry = 0;
  let totalCostTry = 0;

  // Odalar (sejour_rooms)
  const { data: rooms } = await supabase
    .from('sejour_rooms')
    .select('id, total_price, price, currency, cost_price, cost_currency, fx, cost_fx')
    .eq('sejour_id', sejourId);

  if (rooms && rooms.length > 0) {
    for (const r of rooms as any[]) {
      const salesFx = strategy === 'manuel' ? (Number(r.fx) || getCurrencyFx(r.currency)) : getCurrencyFx(r.currency);
      const costFx = strategy === 'manuel' ? (Number(r.cost_fx) || getCurrencyFx(r.cost_currency)) : getCurrencyFx(r.cost_currency);
      const sPrice = Number(r.total_price !== undefined ? r.total_price : (r.price || 0));
      const cPrice = Number(r.cost_price || 0);

      const rTotalTry = sPrice * salesFx;
      const rCostTotalTry = cPrice * costFx;

      totalSalesTry += rTotalTry;
      totalCostTry += rCostTotalTry;

      try {
        await supabase
          .from('sejour_rooms')
          .update({
            fx: salesFx,
            cost_fx: costFx,
            total_try: rTotalTry,
            cost_total_try: rCostTotalTry
          })
          .eq('id', r.id);
      } catch (err) {
        console.warn(`Error updating sejour_rooms row ${r.id}:`, err);
      }
    }
  }

  // Uçuşlar (sejour_flights)
  const { data: flights } = await supabase
    .from('sejour_flights')
    .select('id, total_price, price, currency, cost_price, cost_currency, fx, cost_fx')
    .eq('sejour_id', sejourId);

  if (flights && flights.length > 0) {
    for (const f of flights as any[]) {
      const salesFx = strategy === 'manuel' ? (Number(f.fx) || getCurrencyFx(f.currency)) : getCurrencyFx(f.currency);
      const costFx = strategy === 'manuel' ? (Number(f.cost_fx) || getCurrencyFx(f.cost_currency)) : getCurrencyFx(f.cost_currency);
      const sPrice = Number(f.total_price !== undefined ? f.total_price : (f.price || 0));
      const cPrice = Number(f.cost_price || 0);

      const fTotalTry = sPrice * salesFx;
      const fCostTotalTry = cPrice * costFx;

      totalSalesTry += fTotalTry;
      totalCostTry += fCostTotalTry;

      try {
        await supabase
          .from('sejour_flights')
          .update({
            fx: salesFx,
            cost_fx: costFx,
            total_try: fTotalTry,
            cost_total_try: fCostTotalTry
          })
          .eq('id', f.id);
      } catch (err) {
        console.warn(`Error updating sejour_flights row ${f.id}:`, err);
      }
    }
  }

  // Transferler (sejour_transfers)
  const { data: transfers } = await supabase
    .from('sejour_transfers')
    .select('id, price, currency, cost_price, cost_currency, fx, cost_fx')
    .eq('sejour_id', sejourId);

  if (transfers && transfers.length > 0) {
    for (const t of transfers as any[]) {
      const salesFx = strategy === 'manuel' ? (Number(t.fx) || getCurrencyFx(t.currency)) : getCurrencyFx(t.currency);
      const costFx = strategy === 'manuel' ? (Number(t.cost_fx) || getCurrencyFx(t.cost_currency)) : getCurrencyFx(t.cost_currency);
      const sPrice = Number(t.price || 0);
      const cPrice = Number(t.cost_price || 0);

      const tTotalTry = sPrice * salesFx;
      const tCostTotalTry = cPrice * costFx;

      totalSalesTry += tTotalTry;
      totalCostTry += tCostTotalTry;

      try {
        await supabase
          .from('sejour_transfers')
          .update({
            fx: salesFx,
            cost_fx: costFx,
            total_try: tTotalTry,
            cost_total_try: tCostTotalTry
          })
          .eq('id', t.id);
      } catch (err) {
        console.warn(`Error updating sejour_transfers row ${t.id}:`, err);
      }
    }
  }

  // Ekstra Hizmetler (sejour_extra_services)
  const { data: extras } = await supabase
    .from('sejour_extra_services')
    .select('id, price, currency, cost_price, cost_currency, fx, cost_fx')
    .eq('sejour_id', sejourId);

  if (extras && extras.length > 0) {
    for (const ex of extras as any[]) {
      const salesFx = strategy === 'manuel' ? (Number(ex.fx) || getCurrencyFx(ex.currency)) : getCurrencyFx(ex.currency);
      const costFx = strategy === 'manuel' ? (Number(ex.cost_fx) || getCurrencyFx(ex.cost_currency)) : getCurrencyFx(ex.cost_currency);
      const sPrice = Number(ex.price || 0);
      const cPrice = Number(ex.cost_price || 0);

      const exTotalTry = sPrice * salesFx;
      const exCostTotalTry = cPrice * costFx;

      totalSalesTry += exTotalTry;
      totalCostTry += exCostTotalTry;

      try {
        await supabase
          .from('sejour_extra_services')
          .update({
            fx: salesFx,
            cost_fx: costFx,
            total_try: exTotalTry,
            cost_total_try: exCostTotalTry
          })
          .eq('id', ex.id);
      } catch (err) {
        console.warn(`Error updating sejour_extra_services row ${ex.id}:`, err);
      }
    }
  }

  const netProfitTry = totalSalesTry - totalCostTry;

  // 4. Sejour ana tablosunu güncelle
  const currentTotals = typeof sejour.totals === 'object' && sejour.totals ? { ...sejour.totals } : { TRY: 0, EUR: 0, USD: 0, GBP: 0 };
  const currentCosts = typeof sejour.costs === 'object' && sejour.costs ? { ...sejour.costs } : { TRY: 0, EUR: 0, USD: 0, GBP: 0 };
  const currentProfits = typeof sejour.profits === 'object' && sejour.profits ? { ...sejour.profits } : { TRY: 0, EUR: 0, USD: 0, GBP: 0 };

  currentTotals.TRY = totalSalesTry;
  currentCosts.TRY = totalCostTry;
  currentProfits.TRY = netProfitTry;

  const updatePayload: any = {
    exchange_rate_strategy: strategy,
    usd_rate,
    eur_rate,
    gbp_rate,
    total_sales_try: totalSalesTry,
    total_cost_try: totalCostTry,
    net_profit_try: netProfitTry,
    totals: currentTotals,
    costs: currentCosts,
    profits: currentProfits
  };

  try {
    const { error: updateErr } = await supabase
      .from('sejours')
      .update(updatePayload)
      .eq('id', sejourId);

    if (updateErr) {
      if (updateErr.code === '42703' || updateErr.message?.includes('column')) {
        console.warn('Sejour kur kolonları eksik, sadece JSONB güncelleniyor...');
        await supabase
          .from('sejours')
          .update({
            totals: currentTotals,
            costs: currentCosts,
            profits: currentProfits
          })
          .eq('id', sejourId);
      } else {
        throw updateErr;
      }
    }
  } catch (e) {
    console.error('Sejour update error in updateSejourRates:', e);
  }

  return {
    success: true,
    strategy,
    usd_rate,
    eur_rate,
    gbp_rate,
    total_sales_try: totalSalesTry,
    total_cost_try: totalCostTry,
    net_profit_try: netProfitTry
  };
}
