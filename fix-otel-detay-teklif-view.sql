-- =============================================================================
-- vw_rp_otel_detay_teklif — Otel Detaylı Teklif Raporu
-- Rapor Merkezi / backend: vw_rp_otel_detay_teklif
--
-- Bu görünüm, teklif kalemlerini (quote_items) temel alır ve her kalemi 
-- bağlı olduğu otel (hotel_id) ile eşleştirerek getirir. 
-- Künye (quotes) üzerindeki tek otel yerine, kalemlerin kendi otellerini gösterir.
-- =============================================================================

DROP VIEW IF EXISTS public.vw_rp_otel_detay_teklif CASCADE;

CREATE VIEW public.vw_rp_otel_detay_teklif AS
WITH quote_dates AS (
    -- Her teklif-otel çifti için hotels_data içindeki tarihleri ayıkla
    SELECT 
        q.id as quote_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi
    FROM public.quotes q,
    jsonb_array_elements(CASE WHEN jsonb_typeof(q.hotels_data) = 'array' THEN q.hotels_data ELSE '[]'::jsonb END) h_data
)
SELECT
    q.reference AS teklif_no,
    COALESCE(qd.cin_tarihi, q.check_in_date) AS cin_tarihi,
    COALESCE(qd.cout_tarihi, q.check_out_date) AS cout_tarihi,
    q.company_name AS firma_adi,
    a.name AS acente,
    h.name AS otel,
    qi.sub_category AS alt_kategori,
    qi.unit_quantity AS adet,
    qi.sefer AS sefer,
    qi.unit_price AS birim_satis,
    qi.currency AS para_birimi,
    q.status AS teklif_durumu
FROM public.quote_items qi
JOIN public.quotes q ON q.id = qi.quote_id
LEFT JOIN public.agencies a ON a.id = q.agency_id
LEFT JOIN public.hotels h ON h.id = qi.hotel_id
LEFT JOIN quote_dates qd ON qd.quote_id = q.id AND qd.hotel_id = qi.hotel_id
WHERE qi.main_category IN ('OTEL | KONAKLAMA', 'OTEL | DİĞER HİZMETLER', '1', '2') 
   OR qi.hotel_id IS NOT NULL;

COMMENT ON VIEW public.vw_rp_otel_detay_teklif IS 
'Otel bazlı teklif kalemleri: Her kalemi kendi oteli ve tarihleri (hotels_data) ile eşleştirir.';
