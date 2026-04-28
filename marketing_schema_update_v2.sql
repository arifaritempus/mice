-- Marketing Interactions tablosunu çoklu kişi desteği için güncelle
ALTER TABLE public.marketing_interactions ADD COLUMN IF NOT EXISTS contact_ids UUID[] DEFAULT '{}';

-- Eğer contact_id doluysa contact_ids dizisine ekle (Migrasyon)
UPDATE public.marketing_interactions 
SET contact_ids = ARRAY[contact_id] 
WHERE contact_id IS NOT NULL AND (contact_ids IS NULL OR array_length(contact_ids, 1) IS NULL);

-- Edit yetkileri için RLS politikalarını kontrol et (zaten Enable all demiştik ama garantiye alalım)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable delete for authenticated users' AND polrelid = 'public.marketing_clients'::regclass) THEN
        CREATE POLICY "Enable delete for authenticated users" ON public.marketing_clients FOR DELETE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable delete for authenticated users' AND polrelid = 'public.marketing_interactions'::regclass) THEN
        CREATE POLICY "Enable delete for authenticated users" ON public.marketing_interactions FOR DELETE TO authenticated USING (true);
    END IF;
END $$;
