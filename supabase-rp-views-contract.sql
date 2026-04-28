-- =============================================================================
-- Rapor Merkezi: vw_rp_* view sözleşmesi ve Supabase doğrulama
-- Uygulama (backend/src/routes/reports.js) bu view'lere select('*') ile erişir
-- ve birden fazla olası sütun adını eşler. Yine de view çıktılarında aşağıdaki
-- isimleri kullanmanız bakım ve performans için önerilir.
-- =============================================================================
--
-- vw_rp_opsiyon_takip
--   Önerilen: teklif_no, cin_tarihi, cout_tarihi, firma_adi, acente, otel,
--   opsiyon_tarihi, opsiyon_durumu, otel_durumu, opsiyon_tutari, doviz_birimi
--   Alternatif eşlemeler (kod tarafında): quote_number, quote_no, check_in_date,
--   check_out_date, company_name, agency_name, otel_adi, hotel_name, toplam_tutar,
--   para_birimi, currency
--
-- vw_rp_otel_detay_teklif
--   Önerilen: teklif_no, cin_tarihi, cout_tarihi, firma_adi, acente, otel,
--   alt_kategori, adet, sefer, birim_satis, para_birimi, teklif_durumu
--
-- vw_rp_otel_detay_proje_maliyet
--   Önerilen: proje_referans (veya referans_no), organizasyon_tarihi, cikis_tarihi,
--   firma_adi, acente, otel, alt_kategori, adet, sefer, birim_satis, birim_maliyet,
--   para_birimi, main_category (CAT_001 / CAT_002 otel kalemleri için filtrelenir)
--
-- vw_rp_proje_satis_maliyet — tanım: supabase-vw-rp-proje-satis-maliyet.sql
--   Önerilen: project_id, referans_no, organizasyon_tarihi, cikis_tarihi, firma,
--   acente, otel, durum, satis_tl, maliyet_tl, kar_zarar_tl, kar_marj_yuzde
--
-- vw_rp_sejour_kar_zarar — tanım için: supabase-vw-rp-sejour-kar-zarar.sql
--   Önerilen: voucher_no veya voucher_number (ikisi de desteklenir),
--   giris_tarihi veya check_in_date, cikis_tarihi veya check_out_date,
--   acente, otel, durum, satis_tl, maliyet_tl, kar_zarar_tl, kar_marj_yuzde
--
-- =============================================================================
-- Aşağıdaki sorgular mevcut view sütunlarını listeler; eksik alias'ları tespit
-- etmek için Supabase SQL Editor'de çalıştırın.
-- =============================================================================

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'vw_rp_opsiyon_takip',
    'vw_rp_otel_detay_teklif',
    'vw_rp_otel_detay_proje_maliyet',
    'vw_rp_proje_satis_maliyet',
    'vw_rp_sejour_kar_zarar'
  )
ORDER BY table_name, ordinal_position;

-- Not: View gövdesini değiştirmek için mevcut CREATE VIEW / SELECT ifadenizi
-- CREATE OR REPLACE VIEW ... AS <sorgunuz> şeklinde güncellemeniz gerekir;
-- bu dosyada üretim tablolarınıza özel tam view tanımı yoktur (ortamınıza göre).
