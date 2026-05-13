-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu (v3 - GÜNCEL)
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
WITH project_dates AS (
    SELECT 
        p.id as project_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi
    FROM public.projects p,
    jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
),
sales AS (
  SELECT
    psi.id,
    psi.project_id,
    psi.hotel_id,
    psi.category,
    psi.sub_category,
    psi.description,
    psi.unit_quantity::numeric AS unit_quantity,
    COALESCE(psi.sefer, 1)::numeric AS sefer,
    COALESCE(psi.unit_price, 0)::numeric AS unit_price,
    NULLIF(TRIM(psi.currency), '') AS currency,
    ROW_NUMBER() OVER (
      PARTITION BY
        psi.project_id,
        COALESCE(psi.hotel_id::text, ''),
        COALESCE(psi.category, ''),
        COALESCE(psi.sub_category, '')
      ORDER BY psi.created_at NULLS LAST, psi.id
    ) AS pair_rn
  FROM public.project_sales_items psi
),
purch AS (
  SELECT
    ppi.id,
    ppi.project_id,
    ppi.hotel_id,
    ppi.category,
    ppi.sub_category,
    COALESCE(ppi.unit_price, 0)::numeric AS unit_price,
    ROW_NUMBER() OVER (
      PARTITION BY
        ppi.project_id,
        COALESCE(ppi.hotel_id::text, ''),
        COALESCE(ppi.category, ''),
        COALESCE(ppi.sub_category, '')
      ORDER BY ppi.created_at NULLS LAST, ppi.id
    ) AS pair_rn
  FROM public.project_purchase_items ppi
)
SELECT
  LEFT(COALESCE(NULLIF(TRIM(p.reference), ''), p.title, p.id::text), 255)::character varying(255) AS proje_referans,
  COALESCE(pd.cin_tarihi, p.start_date)::date AS organizasyon_tarihi,
  COALESCE(pd.cout_tarihi, p.end_date)::date AS cikis_tarihi,
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
LEFT JOIN public.hotels h ON h.id = psi.hotel_id
LEFT JOIN public.categories cat ON cat.id::text = psi.sub_category::text
LEFT JOIN project_dates pd ON pd.project_id = p.id AND pd.hotel_id = psi.hotel_id
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
  AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
  AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
  AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
  AND ppi.pair_rn = psi.pair_rn
WHERE psi.category::text IN ('CAT_001', 'CAT_002', '1', '2') 
   OR psi.hotel_id IS NOT NULL;
