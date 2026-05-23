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

    const rates = currencies
      .filter((c: any) => c.ForexBuying && c.ForexSelling)
      .map((c: any) => ({
        tarih,
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

    console.log(`[TCMB] ${rates.length} kur bulundu.`);

    if (rates.length === 0) {
      return NextResponse.json({ message: 'Kur bulunamadı.' }, { status: 200 });
    }

    // Upsert the data into Supabase
    // tarih ve kod için unique index (idx_tcmb_tarih_kod) olduğundan onConflict ile upsert kullanabiliriz
    const { data, error } = await supabase
      .from('tcmb_kurlari')
      .upsert(rates, { onConflict: 'tarih, kod' })
      .select();

    if (error) {
      console.error('[TCMB Supabase Error]:', error);
      throw error;
    }

    console.log(`[TCMB] ${rates.length} kur başarıyla kaydedildi/güncellendi.`);

    return NextResponse.json({
      success: true,
      message: `${rates.length} kur başarıyla kaydedildi.`,
      date: tarih
    });
  } catch (error: any) {
    console.error('[TCMB Fetch Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Bilinmeyen Hata' },
      { status: 500 }
    );
  }
}
