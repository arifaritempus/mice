-- =============================================================================
-- vw_rp_proje_satis_maliyet — Proje satış / alış özeti (TRY), rapor gruplaması için
-- Backend: fetchProjeSatisMaliyetProjectRows → Acente/Otel Kar-Zarar, Kar-Zarar
-- detay, marj raporları, yıllık yatay TL
--
-- Çıktı (önerilen sütun adları):
--   project_id, referans_no, organizasyon_tarihi, cikis_tarihi, firma, acente,
--   otel, durum, satis_tl, maliyet_tl, kar_zarar_tl, kar_marj_yuzde
--
-- Not: projects.reference yoksa önce ALTER ile ekleyin veya referans_no için
-- yalnızca title kullanın.
--
-- PostgreSQL: CREATE OR REPLACE VIEW mevcut görünümden sütun silemez (42P16).
-- Bu dosya önce DROP VIEW, sonra CREATE VIEW kullanır. Başka view'lar buna
-- bağlıysa CASCADE onları da kaldırır; gerekirse önce bağımlılıkları kontrol edin.
-- =============================================================================

DROP VIEW IF EXISTS public.vw_rp_proje_satis_maliyet CASCADE;

CREATE VIEW public.vw_rp_proje_satis_maliyet AS
WITH sales_agg AS (
  SELECT
    psi.project_id,
    COALESCE(
      SUM(
        COALESCE(
          psi.total_try,
          COALESCE(psi.total_price, 0::numeric) * COALESCE(psi.fx, 1::numeric),
          0::numeric
        )
      ),
      0::numeric
    ) AS satis_tl
  FROM public.project_sales_items psi
  GROUP BY psi.project_id
),
purchase_agg AS (
  SELECT
    ppi.project_id,
    COALESCE(
      SUM(
        COALESCE(
          ppi.total_try,
          COALESCE(ppi.total_price, 0::numeric) * COALESCE(ppi.fx, 1::numeric),
          0::numeric
        )
      ),
      0::numeric
    ) AS maliyet_tl
  FROM public.project_purchase_items ppi
  GROUP BY ppi.project_id
)
SELECT
  p.id AS project_id,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(p.reference::text, '')), ''),
      NULLIF(TRIM(COALESCE(p.title::text, '')), ''),
      p.id::text
    ),
    200
  )::varchar AS referans_no,
  p.start_date::date AS organizasyon_tarihi,
  p.end_date::date AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.company_name, '')), ''), '-'), 255)::varchar AS firma,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(a.name, '')), ''), '-'), 255)::varchar AS acente,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(hp.name, '')), ''),
      NULLIF(TRIM(COALESCE(hi.name, '')), ''),
      '-'
    ),
    255
  )::varchar AS otel,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.status, '')), ''), 'BEKLEMEDE'), 80)::varchar AS durum,
  COALESCE(sa.satis_tl, 0::numeric) AS satis_tl,
  COALESCE(pa.maliyet_tl, 0::numeric) AS maliyet_tl,
  (COALESCE(sa.satis_tl, 0::numeric) - COALESCE(pa.maliyet_tl, 0::numeric)) AS kar_zarar_tl,
  (
    CASE
      WHEN COALESCE(sa.satis_tl, 0::numeric) > 0::numeric THEN
        ROUND(
          (
            ((COALESCE(sa.satis_tl, 0::numeric) - COALESCE(pa.maliyet_tl, 0::numeric)) / sa.satis_tl)
            * 100::numeric
          )::numeric,
          2
        )
      ELSE 0::numeric
    END
  ) AS kar_marj_yuzde
FROM public.projects p
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN public.hotels hp ON hp.id = p.hotel_id
LEFT JOIN sales_agg sa ON sa.project_id = p.id
LEFT JOIN purchase_agg pa ON pa.project_id = p.id
LEFT JOIN LATERAL (
  SELECT h.name
  FROM public.project_sales_items psi
  INNER JOIN public.hotels h ON h.id = psi.hotel_id
  WHERE psi.project_id = p.id
    AND psi.hotel_id IS NOT NULL
  ORDER BY psi.created_at DESC NULLS LAST, psi.id DESC
  LIMIT 1
) hi ON true;

COMMENT ON VIEW public.vw_rp_proje_satis_maliyet IS
  'Proje başına TRY satış (project_sales_items), TRY alış (project_purchase_items), kar/zarar ve marj %; raporlar için.';
