import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

// Supabase client (Servis rolü ile oluşturuyoruz ki RLS'e takılmadan yazabilsin)
// Cron job çalışırken authenticate olmayacak.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

export const revalidate = 0; // Disable cache for this route

export async function GET(request: NextRequest) {
  try {
    // Güvenlik kontrolü: Vercel Cron isteğini doğrula
    // Eğer cron dışında manuel test için açmak isterseniz bu auth blokunu dev modunda devre dışı bırakabilirsiniz.
    const authHeader = request.headers.get('authorization');
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      !request.nextUrl.searchParams.has('manual') // Manuel tetikleme için bir escape hatch
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[TCMB] Kurlar çekiliyor...');
    const res = await fetch(TCMB_URL, {
      headers: { 'Accept': 'application/xml' },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`TCMB yanıt vermedi: ${res.status}`);
    }

    const xml = await res.text();
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
    });
    
    const json = parser.parse(xml);
    const tarihDate = json.Tarih_Date;
    if (!tarihDate) {
      throw new Error('TCMB veri yapısı beklenmeyen formatta.');
    }
    
    const currencies = Array.isArray(tarihDate.Currency)
      ? tarihDate.Currency
      : [tarihDate.Currency];

    const dateRaw = tarihDate['@_Tarih'] || tarihDate['@_Date'];
    let [, day, month, year] = (dateRaw || '').match(/(\d{2})[\.\/](\d{2})[\.\/](\d{4})/) || [];
    if (!day) throw new Error(`Tarih parse edilemedi: ${dateRaw}`);
    const tarih = `${year}-${month}-${day}`;
    const bultenNo = tarihDate['@_Bulten_No'] || '';

    const targetCodes = ['USD', 'EUR', 'GBP'];

    const baseRates = currencies
      .filter((c: any) => targetCodes.includes(c['@_Kod']) && c.ForexBuying && c.ForexSelling)
      .map((c: any) => ({
        bulten_no: bultenNo,
        kod: c['@_Kod'],
        currency_code: c['@_CurrencyCode'],
        birim: Number(c.Unit) || 1,
        isim: c.Isim,
        currency_name: c.CurrencyName,
        forex_buying: parseFloat(c.ForexBuying.replace(',', '.')),
        forex_selling: parseFloat(c.ForexSelling.replace(',', '.')),
        banknote_buying: c.BanknoteBuying
          ? parseFloat(c.BanknoteBuying.replace(',', '.'))
          : null,
        banknote_selling: c.BanknoteSelling
          ? parseFloat(c.BanknoteSelling.replace(',', '.'))
          : null,
        cross_rate_usd: c.CrossRateUSD
          ? parseFloat(c.CrossRateUSD.replace(',', '.'))
          : null,
      }));

    console.log(`[TCMB] ${baseRates.length} kur bulundu.`);

    if (baseRates.length === 0) {
      return NextResponse.json({ message: 'Kur bulunamadı.' }, { status: 200 });
    }

    // Determine the dates to fill
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
    
    // Find the last recorded date in DB
    const { data: lastRecord, error: lastRecordErr } = await supabase
      .from('tcmb_kurlari')
      .select('tarih')
      .order('tarih', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    let datesToFill: string[] = [];
    
    if (!lastRecordErr && lastRecord?.tarih) {
      const maxDateStr = lastRecord.tarih;
      let curr = new Date(maxDateStr);
      curr.setUTCDate(curr.getUTCDate() + 1); // start from next day
      const todayDate = new Date(todayStr);
      
      while (curr <= todayDate) {
        datesToFill.push(curr.toISOString().split('T')[0]);
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }
    
    // If we're up to date but want to ensure today is written (e.g. manual trigger on same day), or no previous records
    if (datesToFill.length === 0) {
      datesToFill.push(todayStr);
    }

    const allRatesToUpsert = [];
    for (const d of datesToFill) {
      for (const r of baseRates) {
        allRatesToUpsert.push({ ...r, tarih: d });
      }
    }

    // Upsert the data into Supabase
    // tarih ve kod için unique index (idx_tcmb_tarih_kod) olduğundan onConflict ile upsert kullanabiliriz
    const { data, error } = await supabase
      .from('tcmb_kurlari')
      .upsert(allRatesToUpsert, { onConflict: 'tarih, kod' })
      .select();

    if (error) {
      console.error('[TCMB Supabase Error]:', error);
      throw error;
    }

    console.log(`[TCMB] ${datesToFill.length} gün için toplam ${allRatesToUpsert.length} kur başarıyla kaydedildi/güncellendi.`);

    // --- PROJELERİN KURLARINI GÜNCELLEME ---
    // Stratejisi manuel olmayan ve başlangıç tarihi bugünden büyük veya eşit olan projeleri bul
    
    const { data: activeProjects, error: projectErr } = await supabase
      .from('projects')
      .select('id, exchange_rate_strategy, start_date')
      .not('exchange_rate_strategy', 'eq', 'manuel')
      .not('exchange_rate_strategy', 'is', null);
      
    if (!projectErr && activeProjects && activeProjects.length > 0) {
      // lib/projectRatesService modülünü dinamik veya import ile çağır
      const { updateProjectRates } = await import('@/lib/projectRatesService');
      let updateCount = 0;
      
      for (const proj of activeProjects) {
        // Eğer projenin başlangıç tarihi henüz gelmediyse veya tam bugünse günceller
        // Başlangıç tarihi geçmişse (daha küçükse) artık sabitlemiştir, atlar
        if (proj.start_date && proj.start_date >= todayStr) {
          try {
            await updateProjectRates(proj.id, proj.exchange_rate_strategy);
            updateCount++;
          } catch (e) {
            console.error(`Proje kur güncelleme hatası (${proj.id}):`, e);
          }
        }
      }
      console.log(`[TCMB] ${updateCount} projenin kurları ve kalemleri başarıyla güncellendi.`);
    }

    return NextResponse.json({
      success: true,
      message: `${allRatesToUpsert.length} kur kaydedildi. Projeler güncellendi.`,
      date: todayStr
    });
  } catch (error: any) {
    console.error('[TCMB Fetch Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Bilinmeyen Hata' },
      { status: 500 }
    );
  }
}
