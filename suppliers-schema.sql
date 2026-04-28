-- Suppliers tablosuna modal alanlarını ekle
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS title                  text,
  ADD COLUMN IF NOT EXISTS service_type           text,
  ADD COLUMN IF NOT EXISTS contact_person         text,
  ADD COLUMN IF NOT EXISTS phone                  text,
  ADD COLUMN IF NOT EXISTS email                  text,
  ADD COLUMN IF NOT EXISTS address                text,
  ADD COLUMN IF NOT EXISTS tax_id                 text,
  ADD COLUMN IF NOT EXISTS tax_office             text,
  ADD COLUMN IF NOT EXISTS accounting_link_codes  jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_info              jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contract_info          jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active              boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS notes                  text,
  ADD COLUMN IF NOT EXISTS created_at             timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at             timestamptz;

-- updated_at için trigger
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_suppliers ON public.suppliers;
CREATE TRIGGER set_timestamp_suppliers
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
