import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

// Supabase client oluşturma kodları içeride (Build zamanı sorun olmaması için)
export const revalidate = 0; // Disable cache for this route

async function fetchTcmbDate(dateStr: string) {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());

  let url = "https://www.tcmb.gov.tr/kurlar/today.xml";
  if (dateStr !== todayStr) {
    const [year, month, day] = dateStr.split("-");
    // TCMB arşiv URL formatı: YYYYMM/DDMMYYYY.xml
    url = `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`;
  }

  const res = await fetch(url, {
    headers: { Accept: "application/xml" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TCMB HTTP ${res.status}`);
  }

  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
  });

  const json = parser.parse(xml);
  const tarihDate = json.Tarih_Date;
  if (!tarihDate) {
    throw new Error("TCMB veri yapısı beklenmeyen formatta.");
  }

  const currencies = Array.isArray(tarihDate.Currency)
    ? tarihDate.Currency
    : [tarihDate.Currency];

  const bultenNo = tarihDate["@_Bulten_No"] || "";
  const targetCodes = ["USD", "EUR", "GBP"];

  return currencies
    .filter(
      (c: any) =>
        targetCodes.includes(c["@_Kod"]) && c.ForexBuying && c.ForexSelling,
    )
    .map((c: any) => ({
      bulten_no: bultenNo,
      kod: c["@_Kod"],
      currency_code: c["@_CurrencyCode"],
      birim: Number(c.Unit) || 1,
      isim: c.Isim,
      currency_name: c.CurrencyName,
      forex_buying: parseFloat(c.ForexBuying.replace(",", ".")),
      forex_selling: parseFloat(c.ForexSelling.replace(",", ".")),
      banknote_buying: c.BanknoteBuying
        ? parseFloat(c.BanknoteBuying.replace(",", "."))
        : null,
      banknote_selling: c.BanknoteSelling
        ? parseFloat(c.BanknoteSelling.replace(",", "."))
        : null,
      cross_rate_usd: c.CrossRateUSD
        ? parseFloat(c.CrossRateUSD.replace(",", "."))
        : null,
    }));
}

export async function GET(request: NextRequest) {
  try {
    // Supabase client (Servis rolü ile oluşturuyoruz ki RLS'e takılmadan yazabilsin)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Güvenlik kontrolü: Vercel Cron isteğini doğrula
    const authHeader = request.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      !request.nextUrl.searchParams.has("manual") // Manuel tetikleme için escape hatch
    ) {
      console.error(`[CRON AUTH FAIL] authHeader is present: ${!!authHeader}, envSecret is present: ${!!process.env.CRON_SECRET}`);
      return NextResponse.json({ error: "Unauthorized", debug: { hasAuth: !!authHeader, hasEnv: !!process.env.CRON_SECRET } }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
    }).format(new Date());
    let datesToFill: string[] = [];

    if (startDateParam && endDateParam) {
      // Özel tarih aralığı verilmişse sadece o aralığı doldur
      let curr = new Date(startDateParam);
      let end = new Date(endDateParam);
      const todayDate = new Date(todayStr);
      if (end > todayDate) {
        end = todayDate;
      }
      while (curr <= end) {
        datesToFill.push(curr.toISOString().split("T")[0]);
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    } else {
      // Verilmemişse veritabanındaki son tarihten bugüne kadar olanları doldur (Cron Job mantığı)
      const { data: lastRecord, error: lastRecordErr } = await supabase
        .from("tcmb_kurlari")
        .select("tarih")
        .order("tarih", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastRecordErr && lastRecord?.tarih) {
        let curr = new Date(lastRecord.tarih);
        curr.setUTCDate(curr.getUTCDate() + 1); // start from next day
        const todayDate = new Date(todayStr);

        while (curr <= todayDate) {
          datesToFill.push(curr.toISOString().split("T")[0]);
          curr.setUTCDate(curr.getUTCDate() + 1);
        }
      }

      if (datesToFill.length === 0) {
        datesToFill.push(todayStr);
      }
    }

    console.log(`[TCMB] İşlenecek tarih sayısı: ${datesToFill.length}`);

    // Hafta sonları/tatiller için en son bilinen kuru al
    let lastKnownRates: any[] = [];

    // Eğer datesToFill'in ilk günü için elimizde fallback yoksa veritabanından en son kuru çek
    if (datesToFill.length > 0) {
      const { data: latestDbRates } = await supabase
        .from("tcmb_kurlari")
        .select("*")
        .in("kod", ["USD", "EUR", "GBP"])
        .lt("tarih", datesToFill[0])
        .order("tarih", { ascending: false })
        .limit(3);

      if (latestDbRates && latestDbRates.length > 0) {
        const latestDateStr = latestDbRates[0].tarih;
        lastKnownRates = latestDbRates.filter((r) => r.tarih === latestDateStr);
      }
    }

    const allRatesToUpsert = [];
    for (const d of datesToFill) {
      try {
        const rates = await fetchTcmbDate(d);
        lastKnownRates = rates; // Son başarılı kuru güncelle
        for (const r of rates) {
          allRatesToUpsert.push({ ...r, tarih: d });
        }
      } catch (err: any) {
        console.warn(
          `[TCMB] ${d} kur çekilemedi. Önceki bilinen kur kopyalanıyor.`,
        );
        if (lastKnownRates.length > 0) {
          for (const r of lastKnownRates) {
            allRatesToUpsert.push({
              bulten_no: r.bulten_no,
              kod: r.kod,
              currency_code: r.currency_code,
              birim: r.birim,
              isim: r.isim,
              currency_name: r.currency_name,
              forex_buying: r.forex_buying,
              forex_selling: r.forex_selling,
              banknote_buying: r.banknote_buying,
              banknote_selling: r.banknote_selling,
              cross_rate_usd: r.cross_rate_usd,
              tarih: d,
            });
          }
        }
      }
    }

    if (allRatesToUpsert.length === 0) {
      return NextResponse.json(
        { message: "Kur bulunamadı veya çekilemedi." },
        { status: 200 },
      );
    }

    // Upsert the data into Supabase
    const { error } = await supabase
      .from("tcmb_kurlari")
      .upsert(allRatesToUpsert, { onConflict: "tarih, kod" })
      .select();

    if (error) {
      console.error("[TCMB Supabase Error]:", error);
      throw error;
    }

    console.log(
      `[TCMB] Toplam ${allRatesToUpsert.length} kur başarıyla kaydedildi/güncellendi.`,
    );

    // --- PROJELERİN KURLARINI GÜNCELLEME ---
    const { data: activeProjects, error: projectErr } = await supabase
      .from("projects")
      .select("id, exchange_rate_strategy, start_date, status, locked")
      .not("exchange_rate_strategy", "eq", "manuel")
      .not("exchange_rate_strategy", "is", null);

    if (!projectErr && activeProjects && activeProjects.length > 0) {
      const { updateProjectRates } = await import("@/lib/projectRatesService");
      let updateCount = 0;

      for (const proj of activeProjects) {
        // Tamamlanmış (kilitli) projeleri atlayabiliriz, fakat query'de kısıtlama yoksa burada kontrol edebiliriz
        if (proj.status === "completed" || proj.locked) continue;

        try {
          await updateProjectRates(proj.id, proj.exchange_rate_strategy);
          updateCount++;
        } catch (e) {
          console.error(`Proje kur güncelleme hatası (${proj.id}):`, e);
        }
      }
      console.log(
        `[TCMB] ${updateCount} projenin kurları ve kalemleri başarıyla güncellendi.`,
      );
    }

    return NextResponse.json({
      success: true,
      message: `${allRatesToUpsert.length} kur kaydedildi. Projeler güncellendi.`,
      dates: datesToFill,
    });
  } catch (error: any) {
    console.error("[TCMB Fetch Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Bilinmeyen Hata" },
      { status: 500 },
    );
  }
}
