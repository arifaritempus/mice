-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu
-- Rapor Merkezi / backend: vw_rp_otel_detay_proje_maliyet + main_category CAT_001/002
--
-- View çıktı sütunları (Supabase şema ile uyumlu):
--   proje_referans varchar | organizasyon_tarihi date | cikis_tarihi date
--   firma_adi varchar | acente varchar | otel varchar | alt_kategori varchar
--   adet int4 | sefer numeric | birim_satis numeric | birim_maliyet numeric
--   para_birimi varchar | main_category varchar  (hepsi NULLABLE olabilir)
-- =============================================================================
--
-- Önkoşullar (çoğu ortamda zaten vardır):
--   public.projects (reference, company_name, agency_id, start_date, end_date, …)
--   public.project_sales_items, public.project_purchase_items
--   public.hotels, public.agencies
--   project_sales_items.category: 'CAT_001'/'CAT_002' VEYA categories.id (UUID) —
--   sub_category: metin veya categories.id (UUID); UUID ise alt_kategori = categories.name
--   UUID ise kök kategori: parent_id zinciriyle köke çıkılır; kök adı
--   "KONAKLAMA", "OTEL | KONAKLAMA", "OTEL EKSTRA", "OTEL | DİĞER HİZMETLER" vb. (LIKE ile) eşlenir
--
-- Eğer project_sales_items.sefer sütunu yoksa, önce:
--   ALTER TABLE public.project_sales_items ADD COLUMN IF NOT EXISTS sefer integer DEFAULT 1;
--   ALTER TABLE public.project_purchase_items ADD COLUMN IF NOT EXISTS sefer integer DEFAULT 1;
--
-- Not: CREATE OR REPLACE VIEW mevcut sütun TİPLERİNİ değiştiremez (text ↔ varchar, varchar ↔ varchar(n) vb.).
-- Metin tipleri mevcut view ile birebir (CREATE OR REPLACE tip değiştiremez):
--   proje_referans, main_category → character varying(255)
--   firma_adi, acente, otel, alt_kategori, para_birimi → varchar (sınırsız)
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_rp_otel_detay_proje_maliyet AS
WITH sales AS (
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
  WHERE
    COALESCE(psi.category::text, '') IN ('CAT_001', 'CAT_002')
    OR (
      COALESCE(TRIM(psi.category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (
        WITH RECURSIVE up_cat AS (
          SELECT c.id, c.parent_id, c.name
          FROM public.categories c
          WHERE c.id = TRIM(psi.category::text)::uuid
          UNION ALL
          SELECT p.id, p.parent_id, p.name
          FROM public.categories p
          INNER JOIN up_cat uc ON p.id = uc.parent_id
        )
        SELECT 1
        FROM up_cat uc
        CROSS JOIN LATERAL (
          SELECT upper(
            replace(
              replace(replace(replace(trim(uc.name), 'İ', 'I'), 'ı', 'I'), 'ğ', 'G'),
              'Ğ',
              'G'
            )
          ) AS n
        ) x
        WHERE uc.parent_id IS NULL
          AND (
            x.n LIKE '%KONAKLAMA%'
            OR x.n LIKE '%EKSTRA%'
            OR (x.n LIKE '%OTEL%' AND x.n LIKE '%DIGER%')
          )
      )
    )
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
  WHERE
    COALESCE(ppi.category::text, '') IN ('CAT_001', 'CAT_002')
    OR (
      COALESCE(TRIM(ppi.category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (
        WITH RECURSIVE up_cat AS (
          SELECT c.id, c.parent_id, c.name
          FROM public.categories c
          WHERE c.id = TRIM(ppi.category::text)::uuid
          UNION ALL
          SELECT p.id, p.parent_id, p.name
          FROM public.categories p
          INNER JOIN up_cat uc ON p.id = uc.parent_id
        )
        SELECT 1
        FROM up_cat uc
        CROSS JOIN LATERAL (
          SELECT upper(
            replace(
              replace(replace(replace(trim(uc.name), 'İ', 'I'), 'ı', 'I'), 'ğ', 'G'),
              'Ğ',
              'G'
            )
          ) AS n
        ) x
        WHERE uc.parent_id IS NULL
          AND (
            x.n LIKE '%KONAKLAMA%'
            OR x.n LIKE '%EKSTRA%'
            OR (x.n LIKE '%OTEL%' AND x.n LIKE '%DIGER%')
          )
      )
    )
)
SELECT
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(p.reference, '')), ''),
      NULLIF(TRIM(COALESCE(p.title, '')), ''),
      p.id::text
    ),
    255
  )::character varying(255) AS proje_referans,
  p.start_date::date AS organizasyon_tarihi,
  p.end_date::date AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.company_name, '')), ''), '-'), 255)::varchar AS firma_adi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(a.name, '')), ''), '-'), 255)::varchar AS acente,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(h.name, '')), ''), '-'), 255)::varchar AS otel,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(sc_sub.name, '')), ''),
      CASE
        WHEN COALESCE(TRIM(psi.sub_category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        THEN NULL
        ELSE NULLIF(TRIM(COALESCE(psi.sub_category::text, '')), '')
      END,
      NULLIF(LEFT(TRIM(COALESCE(psi.description, '')), 120), ''),
      '-'
    ),
    255
  )::varchar AS alt_kategori,
  ROUND(COALESCE(psi.unit_quantity, 0))::int4 AS adet,
  COALESCE(psi.sefer, 1)::numeric AS sefer,
  COALESCE(psi.unit_price, 0)::numeric AS birim_satis,
  COALESCE(ppi.unit_price, 0)::numeric AS birim_maliyet,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(psi.currency, '')), ''), 'EUR'), 255)::varchar AS para_birimi,
  LEFT(COALESCE(psi.category, ''), 255)::character varying(255) AS main_category
FROM sales psi
INNER JOIN public.projects p ON p.id = psi.project_id
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN public.hotels h ON h.id = psi.hotel_id
LEFT JOIN public.categories sc_sub ON (
  COALESCE(TRIM(psi.sub_category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND sc_sub.id = TRIM(psi.sub_category::text)::uuid
)
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
 AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
 AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
 AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
 AND ppi.pair_rn = psi.pair_rn;

COMMENT ON VIEW public.vw_rp_otel_detay_proje_maliyet IS
  'Konaklama / otel ekstraları: CAT_001|CAT_002 veya UUID category; alt_kategori UUID ise public.categories.name. Alış: aynı partition+pair_rn.';

-- İsteğe bağlı: API/service role ile okuma (RLS tablolara göre davranır)
-- GRANT SELECT ON public.vw_rp_otel_detay_proje_maliyet TO authenticated;
-- GRANT SELECT ON public.vw_rp_otel_detay_proje_maliyet TO service_role;
