-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu (v6 - ULTIMATE)
-- =============================================================================

-- 1. AGRESİF VERİ ONARICI: project_sales_items tablosundaki hatalı hotel_id'leri düzeltir
DO $$
DECLARE
    r RECORD;
    v_tab_id TEXT;
    v_hotel_id UUID;
BEGIN
    FOR r IN SELECT id, project_id, description, hotel_id FROM public.project_sales_items WHERE description LIKE '%[T:%' LOOP
        v_tab_id := substring(r.description from '\[T:([^\]]+)\]');
        
        SELECT (h_data->>'hotel_id')::uuid INTO v_hotel_id
        FROM public.projects p,
        jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
        WHERE p.id = r.project_id AND h_data->>'id' = v_tab_id;
        
        IF v_hotel_id IS NOT NULL AND (r.hotel_id IS NULL OR r.hotel_id <> v_hotel_id) THEN
            UPDATE public.project_sales_items SET hotel_id = v_hotel_id WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- 2. GÜNCEL RAPOR GÖRÜNÜMÜ
DROP VIEW IF EXISTS public.vw_rp_otel_detay_proje_maliyet CASCADE;

CREATE VIEW public.vw_rp_otel_detay_proje_maliyet AS
WITH exploded_hotels AS (
    SELECT 
        p.id as project_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi
    FROM public.projects p,
    jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
),
sales AS (
  SELECT 
    psi.*,
    substring(psi.description from '\[T:([^\]]+)\]') as extracted_tab_id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        psi.project_id, 
        COALESCE(psi.hotel_id::text, ''), 
        COALESCE(psi.category, ''), 
        COALESCE(psi.sub_category, '') 
      ORDER BY psi.id
    ) as pair_rn
  FROM public.project_sales_items psi
),
purch AS (
  SELECT 
    ppi.*,
    ROW_NUMBER() OVER (
      PARTITION BY 
        ppi.project_id, 
        COALESCE(ppi.hotel_id::text, ''), 
        COALESCE(ppi.category, ''), 
        COALESCE(ppi.sub_category, '') 
      ORDER BY ppi.id
    ) as pair_rn
  FROM public.project_purchase_items ppi
)
SELECT
  p.reference AS proje_referans,
  COALESCE(eh.cin_tarihi, p.start_date) AS organizasyon_tarihi,
  COALESCE(eh.cout_tarihi, p.end_date) AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(p.company_name), ''), '-'), 255)::varchar AS firma_adi,
  LEFT(COALESCE(NULLIF(TRIM(a.name), ''), '-'), 255)::varchar AS acente,
  LEFT(COALESCE(NULLIF(TRIM(h.name), ''), 'BELİRSİZ OTEL'), 255)::varchar AS otel,
  LEFT(COALESCE(NULLIF(TRIM(cat.name), ''), NULLIF(TRIM(psi.sub_category), ''), NULLIF(TRIM(psi.description), ''), '-'), 255)::varchar AS alt_kategori,
  ROUND(COALESCE(psi.unit_quantity, 0))::int4 AS adet,
  COALESCE(psi.sefer, 1)::numeric AS sefer,
  COALESCE(psi.unit_price, 0)::numeric AS birim_satis,
  COALESCE(ppi.unit_price, 0)::numeric AS birim_maliyet,
  LEFT(COALESCE(NULLIF(TRIM(psi.currency), ''), 'EUR'), 255)::varchar AS para_birimi,
  LEFT(COALESCE(psi.category, ''), 255)::character varying(255) AS main_category
FROM sales psi
INNER JOIN public.projects p ON p.id = psi.project_id
LEFT JOIN public.agencies a ON a.id = p.agency_id
-- Sekme eşleşmesi (ULTIMATE MATCH)
LEFT JOIN exploded_hotels eh ON eh.project_id = p.id 
    AND (
        (psi.extracted_tab_id IS NOT NULL AND eh.tab_id = psi.extracted_tab_id)
        OR 
        (psi.extracted_tab_id IS NULL AND (eh.hotel_id = psi.hotel_id OR psi.hotel_id IS NULL))
    )
LEFT JOIN public.hotels h ON h.id = COALESCE(eh.hotel_id, psi.hotel_id)
LEFT JOIN public.categories cat ON cat.id::text = psi.sub_category::text
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
  AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
  AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
  AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
  AND ppi.pair_rn = psi.pair_rn
WHERE psi.category::text IN ('CAT_001', 'CAT_002', '1', '2') 
   OR psi.hotel_id IS NOT NULL;
