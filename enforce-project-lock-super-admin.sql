-- projects.locked alanı sadece super_admin tarafından değiştirilebilsin
-- Supabase SQL Editor'da çalıştırın.

BEGIN;

-- Super admin kontrol helper'ı
-- Not: Bazı ortamlarda users.id = auth.uid() birebir olmayabiliyor.
-- Bu yüzden hem JWT claim'lerini hem users tablosunu (id/email) kontrol eder.
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

  -- JWT içinde super_admin geçiyorsa doğrudan izin ver
  IF EXISTS (
    SELECT 1
    FROM unnest(role_candidates) r
    WHERE lower(r) IN ('super_admin', 'super admin', 'süper admin')
       OR (lower(r) LIKE '%super%' AND (lower(r) LIKE '%admin%' OR lower(r) LIKE '%yönetici%'))
  ) THEN
    RETURN true;
  END IF;

  -- users tablosundan id ile kontrol
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

  -- users tablosundan email ile kontrol (id eşleşmiyorsa fallback)
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

-- locked alanı değişiminde yetki kontrolü
CREATE OR REPLACE FUNCTION public.enforce_projects_locked_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
  uid uuid;
BEGIN
  -- locked değişmiyorsa sorun yok
  IF NEW.locked IS NOT DISTINCT FROM OLD.locked THEN
    RETURN NEW;
  END IF;

  -- service_role (backend/admin) işlemlerine izin ver
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_super_admin(uid) THEN
    RAISE EXCEPTION 'projects.locked sadece super_admin tarafından güncellenebilir';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_projects_locked_update ON public.projects;
CREATE TRIGGER trg_enforce_projects_locked_update
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.enforce_projects_locked_update();

COMMIT;

