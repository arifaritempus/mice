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

-- 1. GÜNCEL RAPOR GÖRÜNÜMÜ (v7.1 - ULTIMATE)
-- Bu sürüm hem otelleri ayırır hem de her otelin kendi durumunu (Konfirme/İptal) gösterir.
DROP VIEW IF EXISTS public.vw_rp_otel_detay_teklif CASCADE;

CREATE VIEW public.vw_rp_otel_detay_teklif AS
WITH exploded_hotels AS (
    SELECT 
        q.id as quote_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi,
        (h_data->>'hotel_status') as hotel_status -- Sekme bazlı durum (İptal/Konfirme)
    FROM public.quotes q,
    jsonb_array_elements(CASE WHEN jsonb_typeof(q.hotels_data) = 'array' THEN q.hotels_data ELSE '[]'::jsonb END) h_data
),
items_with_tags AS (
    SELECT 
        qi.*,
        substring(qi.description from '\[T:([^\]]+)\]') as extracted_tab_id
    FROM public.quote_items qi
)
SELECT
    q.reference AS teklif_no,
    COALESCE(eh.cin_tarihi, q.check_in_date) AS cin_tarihi,
    COALESCE(eh.cout_tarihi, q.check_out_date) AS cout_tarihi,
    q.company_name AS firma_adi,
    a.name AS acente,
    COALESCE(h.name, 'BELİRSİZ OTEL') AS otel,
    COALESCE(cat.name, iwt.sub_category::text, '-') AS alt_kategori,
    iwt.unit_quantity AS adet,
    iwt.sefer AS sefer,
    iwt.unit_price AS birim_satis,
    iwt.currency AS para_birimi,
    COALESCE(eh.hotel_status, q.status) AS teklif_durumu -- ANA DÜZELTME: Sekme durumunu kullan
FROM items_with_tags iwt
JOIN public.quotes q ON q.id = iwt.quote_id
LEFT JOIN public.agencies a ON a.id = q.agency_id
LEFT JOIN LATERAL (
    SELECT exh.*
    FROM exploded_hotels exh
    WHERE exh.quote_id = q.id
    ORDER BY 
        (exh.tab_id = iwt.extracted_tab_id) DESC,
        (exh.hotel_id = iwt.hotel_id) DESC,
        exh.tab_id ASC
    LIMIT 1
) eh ON TRUE
LEFT JOIN public.hotels h ON h.id = COALESCE(eh.hotel_id, iwt.hotel_id)
LEFT JOIN public.categories cat ON cat.id::text = iwt.sub_category::text
WHERE iwt.main_category::text IN ('OTEL | KONAKLAMA', 'OTEL | DİĞER HİZMETLER');
