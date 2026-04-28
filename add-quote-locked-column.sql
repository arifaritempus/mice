-- Teklifler için kilitleme özelliği
-- Supabase SQL Editor'da bir kez çalıştırın.

BEGIN;

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.quotes.locked IS 'Teklif kilit durumu (true: düzenleme/silme kapalı)';

-- Mevcut kayıtlarda null kalmasını önlemek için güvence
UPDATE public.quotes
SET locked = false
WHERE locked IS NULL;

COMMIT;

