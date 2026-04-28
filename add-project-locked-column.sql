-- Projeler için kilitleme özelliği
-- Supabase SQL Editor'da bir kez çalıştırın.

BEGIN;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projects.locked IS 'Proje kilit durumu (true: düzenleme/silme kapalı)';

-- Mevcut kayıtlarda null kalmasını önlemek için güvence
UPDATE public.projects
SET locked = false
WHERE locked IS NULL;

COMMIT;

