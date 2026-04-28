-- Suppliers tablosuna eksik type kolonunu ekle
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'supplier';

-- Mevcut kayıtları güncelle
UPDATE public.suppliers 
SET type = 'supplier' 
WHERE type IS NULL;
