-- =============================================================================
-- vw_rp_otel_detay_teklif — Otel Detaylı Teklif Raporu (FİLTRE DÜZELTME)
-- Sadece OTEL | KONAKLAMA ve OTEL | DİĞER HİZMETLER kategorilerini gösterir.
-- =============================================================================

DROP VIEW IF EXISTS public.vw_rp_otel_detay_teklif CASCADE;

CREATE VIEW public.vw_rp_otel_detay_teklif AS
WITH exploded_hotels AS (
    SELECT 
        q.id as quote_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi,
        (h_data->>'hotel_status') as hotel_status
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
    COALESCE(eh.hotel_status, q.status) AS teklif_durumu
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
WHERE iwt.main_category::text IN (
    'OTEL | KONAKLAMA', 
    'OTEL | DİĞER HİZMETLER', 
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
);

-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu (FİLTRE DÜZELTME)
-- =============================================================================

DROP VIEW IF EXISTS public.vw_rp_otel_detay_proje_maliyet CASCADE;

CREATE VIEW public.vw_rp_otel_detay_proje_maliyet AS
WITH exploded_hotels AS (
    SELECT 
        p.id as project_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi,
        (h_data->>'hotel_status') as hotel_status
    FROM public.projects p,
    jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
),
sales AS (
  SELECT 
    psi.*,
    substring(psi.description from '\[T:([^\]]+)\]') as extracted_tab_id,
    ROW_NUMBER() OVER (PARTITION BY psi.project_id, psi.hotel_id, psi.category, psi.sub_category ORDER BY psi.id) as pair_rn
  FROM public.project_sales_items psi
),
purch AS (
  SELECT 
    ppi.*,
    ROW_NUMBER() OVER (PARTITION BY ppi.project_id, ppi.hotel_id, ppi.category, ppi.sub_category ORDER BY ppi.id) as pair_rn
  FROM public.project_purchase_items ppi
)
SELECT
  p.reference AS proje_referans,
  COALESCE(eh.cin_tarihi, p.start_date) AS organizasyon_tarihi,
  COALESCE(eh.cout_tarihi, p.end_date) AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(p.company_name), ''), '-'), 255)::varchar AS firma_adi,
  LEFT(COALESCE(NULLIF(TRIM(a.name), ''), '-'), 255)::varchar AS acente,
  LEFT(COALESCE(NULLIF(TRIM(h.name), ''), 'BELİRSİZ OTEL'), 255)::varchar AS otel,
  LEFT(COALESCE(NULLIF(TRIM(cat.name), ''), NULLIF(TRIM(psi.sub_category::text), ''), NULLIF(TRIM(psi.description), ''), '-'), 255)::varchar AS alt_kategori,
  ROUND(COALESCE(psi.unit_quantity, 0))::int4 AS adet,
  COALESCE(psi.sefer, 1)::numeric AS sefer,
  COALESCE(psi.unit_price, 0)::numeric AS birim_satis,
  COALESCE(ppi.unit_price, 0)::numeric AS birim_maliyet,
  LEFT(COALESCE(NULLIF(TRIM(psi.currency), ''), 'EUR'), 255)::varchar AS para_birimi,
  LEFT(COALESCE(psi.category, ''), 255)::character varying(255) AS main_category
FROM sales psi
INNER JOIN public.projects p ON p.id = psi.project_id
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN LATERAL (
    SELECT exh.*
    FROM exploded_hotels exh
    WHERE exh.project_id = p.id
    ORDER BY 
        (exh.tab_id = psi.extracted_tab_id) DESC,
        (exh.hotel_id = psi.hotel_id) DESC,
        exh.tab_id ASC
    LIMIT 1
) eh ON TRUE
LEFT JOIN public.hotels h ON h.id = COALESCE(eh.hotel_id, psi.hotel_id)
LEFT JOIN public.categories cat ON cat.id::text = psi.sub_category::text
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
  AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
  AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
  AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
  AND ppi.pair_rn = psi.pair_rn
WHERE psi.category::text IN (
    'OTEL | KONAKLAMA', 
    'OTEL | DİĞER HİZMETLER',
    '00000000-0000-0000-0000-000000000001', 
    '00000000-0000-0000-0000-000000000002'
);
