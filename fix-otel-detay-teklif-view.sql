-- =============================================================================
-- vw_rp_otel_detay_teklif — Otel Detaylı Teklif Raporu (v3 - GÜNCEL)
-- =============================================================================

-- 1. AGRESİF VERİ ONARICI: [T:...] etiketi varsa hotel_id'yi MUTLAKA günceller
DO $$
DECLARE
    r RECORD;
    v_tab_id TEXT;
    v_hotel_id UUID;
BEGIN
    -- Etiketi olan tüm kalemleri tara (NULL olsun olmasın, yanlış atanmışları düzeltmek için)
    FOR r IN SELECT id, quote_id, description, hotel_id FROM public.quote_items WHERE description LIKE '%[T:%' LOOP
        v_tab_id := substring(r.description from '\[T:([^\]]+)\]');
        
        SELECT (h_data->>'hotel_id')::uuid INTO v_hotel_id
        FROM public.quotes q,
        jsonb_array_elements(CASE WHEN jsonb_typeof(q.hotels_data) = 'array' THEN q.hotels_data ELSE '[]'::jsonb END) h_data
        WHERE q.id = r.quote_id AND h_data->>'id' = v_tab_id;
        
        -- Eğer etiketteki otel mevcut hotel_id'den farklıysa düzelt
        IF v_hotel_id IS NOT NULL AND (r.hotel_id IS NULL OR r.hotel_id <> v_hotel_id) THEN
            UPDATE public.quote_items SET hotel_id = v_hotel_id WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- 2. GÜNCEL RAPOR GÖRÜNÜMÜ
DROP VIEW IF EXISTS public.vw_rp_otel_detay_teklif CASCADE;

CREATE VIEW public.vw_rp_otel_detay_teklif AS
WITH quote_dates AS (
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
    COALESCE(h.name, 'BELİRSİZ OTEL') AS otel,
    COALESCE(cat.name, qi.sub_category, '-') AS alt_kategori,
    qi.unit_quantity AS adet,
    qi.sefer AS sefer,
    qi.unit_price AS birim_satis,
    qi.currency AS para_birimi,
    q.status AS teklif_durumu
FROM public.quote_items qi
JOIN public.quotes q ON q.id = qi.quote_id
LEFT JOIN public.agencies a ON a.id = q.agency_id
LEFT JOIN public.hotels h ON h.id = qi.hotel_id
LEFT JOIN public.categories cat ON cat.id::text = qi.sub_category::text
LEFT JOIN quote_dates qd ON qd.quote_id = q.id AND qd.hotel_id = qi.hotel_id
WHERE qi.main_category::text IN ('OTEL | KONAKLAMA', 'OTEL | DİĞER HİZMETLER', '1', '2') 
   OR qi.hotel_id IS NOT NULL;
