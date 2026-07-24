require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const toNum = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};
const pickFirstDate = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  }
  return null;
};
const firstNonEmpty = (...values) => {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== '') return v;
  }
  return null;
};
const computeOpsiyonKalanGun = (opsiyonTarihiRaw) => {
  const optionDate = opsiyonTarihiRaw ? String(opsiyonTarihiRaw).slice(0, 10) : null;
  const target = optionDate ? new Date(optionDate) : null;
  if (!target || Number.isNaN(target.getTime())) return null;
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

async function test() {
  const { data, error } = await supabase.from('vw_rp_opsiyon_takip').select('*');
  if (error) { console.error("DB Error:", error); return; }
  
  try {
      const rows = (data || []).map((r) => {
        const opsiyonTarihi = r.opsiyon_tarihi ? String(r.opsiyon_tarihi).slice(0, 10) : null;
        const tutarRaw = firstNonEmpty(r.opsiyon_tutari, r.toplam_tutar, r.teklif_tutari, r.tutar);
        const dovizRaw = firstNonEmpty(r.doviz_birimi, r.para_birimi, r.currency, r.doviz);
        return {
          teklif_no: firstNonEmpty(r.teklif_no, r.quote_number, r.quote_no) || '-',
          cin_tarihi: pickFirstDate(r.cin_tarihi, r.check_in_date, r.giris_tarihi),
          cout_tarihi: pickFirstDate(r.cout_tarihi, r.check_out_date, r.cikis_tarihi),
          firma_adi: firstNonEmpty(r.firma_adi, r.firma, r.company_name) || '-',
          acente: firstNonEmpty(r.acente, r.agency_name) || '-',
          otel: firstNonEmpty(r.otel, r.otel_adi, r.hotel_name) || '-',
          opsiyon_tarihi: opsiyonTarihi,
          opsiyon_durumu: r.opsiyon_durumu || 'BEKLEMEDE',
          otel_durumu: firstNonEmpty(r.otel_durumu, r.hotel_status, r.otel_status) || '-',
          kalan_gun: computeOpsiyonKalanGun(r.opsiyon_tarihi),
          tutar: toNum(tutarRaw),
          para_birimi: dovizRaw || 'EUR'
        };
      });
      console.log("Success! Extracted rows:", rows.length);
  } catch(e) {
      console.error("Mapping error:", e);
  }
}
test();
