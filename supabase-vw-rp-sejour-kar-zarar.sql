-- =============================================================================
-- vw_rp_sejour_kar_zarar — Sejour Kar/Zarar (voucher bazlı, TL)
-- Backend: backend/src/routes/reports.js → vw_rp_sejour_kar_zarar
--
-- Kaynak: public.sejours (totals / costs / profits JSONB — TRY anahtarı)
-- Acente: agencies | Otel: sejours.hotel_id → hotels, yoksa ilk oda satırı
--
-- Supabase "schema cache" hatası alırsanız: SQL çalıştırdıktan sonra birkaç saniye
-- bekleyin veya Dashboard → Settings → API → "Reload schema" (varsa) / projeyi yeniden deploy.
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_rp_sejour_kar_zarar AS
SELECT
  s.voucher_number::varchar AS voucher_no,
  s.check_in_date::date AS giris_tarihi,
  s.check_out_date::date AS cikis_tarihi,
  COALESCE(NULLIF(TRIM(a.name), ''), '-')::varchar AS acente,
  COALESCE(
    NULLIF(TRIM(h_main.name), ''),
    (
      SELECT NULLIF(TRIM(h2.name), '')
      FROM public.sejour_rooms sr
      JOIN public.hotels h2 ON h2.id = sr.hotel_id
      WHERE sr.sejour_id = s.id
      ORDER BY sr.created_at NULLS LAST, sr.id
      LIMIT 1
    ),
    '-'
  )::varchar AS otel,
  COALESCE(s.status, 'BEKLEMEDE')::varchar AS durum,
  COALESCE((s.totals ->> 'TRY')::numeric, 0)::numeric AS satis_tl,
  COALESCE((s.costs ->> 'TRY')::numeric, 0)::numeric AS maliyet_tl,
  COALESCE(
    (s.profits ->> 'TRY')::numeric,
    COALESCE((s.totals ->> 'TRY')::numeric, 0) - COALESCE((s.costs ->> 'TRY')::numeric, 0)
  )::numeric AS kar_zarar_tl,
  CASE
    WHEN COALESCE((s.totals ->> 'TRY')::numeric, 0) > 0 THEN
      ROUND(
        (
          COALESCE(
            (s.profits ->> 'TRY')::numeric,
            COALESCE((s.totals ->> 'TRY')::numeric, 0) - COALESCE((s.costs ->> 'TRY')::numeric, 0)
          )
          / NULLIF((s.totals ->> 'TRY')::numeric, 0)
          * 100
        )::numeric,
        2
      )
    ELSE 0::numeric
  END AS kar_marj_yuzde
FROM public.sejours s
LEFT JOIN public.agencies a ON a.id = s.agency_id
LEFT JOIN public.hotels h_main ON h_main.id = s.hotel_id;

COMMENT ON VIEW public.vw_rp_sejour_kar_zarar IS
  'Sejour voucher satırı; satış/maliyet/kar TL JSONB alanlarından; marj % satış TL üzerinden.';

-- İsteğe bağlı (RLS politikalarınıza göre):
-- GRANT SELECT ON public.vw_rp_sejour_kar_zarar TO authenticated;
-- GRANT SELECT ON public.vw_rp_sejour_kar_zarar TO service_role;
