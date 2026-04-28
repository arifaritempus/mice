-- quotes.locked alanı sadece super_admin tarafından açılabilsin
-- ve teklif KONFİRME olduğunda otomatik kilitlensin.
-- Supabase SQL Editor'da çalıştırın.

BEGIN;

-- Super admin helper (yoksa oluştur, varsa güncel tut)
CREATE OR REPLACE FUNCTION public.is_super_admin(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  role_candidates text[];
  email_claim text;
BEGIN
  claims := COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  email_claim := COALESCE(claims->>'email', '');

  role_candidates := ARRAY[
    COALESCE(current_setting('request.jwt.claim.role', true), ''),
    COALESCE(claims->>'role', ''),
    COALESCE(claims->>'user_role', ''),
    COALESCE(claims->'app_metadata'->>'role', ''),
    COALESCE(claims->'user_metadata'->>'role', '')
  ];

  IF EXISTS (
    SELECT 1
    FROM unnest(role_candidates) r
    WHERE lower(r) IN ('super_admin', 'super admin', 'süper admin')
       OR (lower(r) LIKE '%super%' AND (lower(r) LIKE '%admin%' OR lower(r) LIKE '%yönetici%'))
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = _uid
      AND (
        lower(coalesce(u.role, '')) IN ('super_admin', 'super admin', 'süper admin')
        OR (lower(coalesce(u.role, '')) LIKE '%super%' AND lower(coalesce(u.role, '')) LIKE '%admin%')
      )
  ) THEN
    RETURN true;
  END IF;

  IF email_claim <> '' AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE lower(coalesce(u.email, '')) = lower(email_claim)
      AND (
        lower(coalesce(u.role, '')) IN ('super_admin', 'super admin', 'süper admin')
        OR (lower(coalesce(u.role, '')) LIKE '%super%' AND lower(coalesce(u.role, '')) LIKE '%admin%')
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_quotes_locked_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
  uid uuid;
BEGIN
  -- service_role işlemlerine izin ver
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  IF jwt_role = 'service_role' THEN
    -- KONFİRME'ye geçişte yine de otomatik kilitle
    IF NEW.status = 'KONFİRME' THEN
      NEW.locked := true;
    END IF;
    RETURN NEW;
  END IF;

  -- Teklif KONFİRME olduğunda her koşulda kilitlenir
  IF NEW.status = 'KONFİRME' THEN
    NEW.locked := true;
  END IF;

  -- Kilit açma (true -> false) sadece super_admin
  IF OLD.locked = true AND NEW.locked = false THEN
    uid := auth.uid();
    IF uid IS NULL OR NOT public.is_super_admin(uid) THEN
      RAISE EXCEPTION 'quotes.locked sadece super_admin tarafından açılabilir';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_quotes_locked_update ON public.quotes;
CREATE TRIGGER trg_enforce_quotes_locked_update
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_quotes_locked_update();

COMMIT;

