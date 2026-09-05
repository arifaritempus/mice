DO $$ 
DECLARE
    row record;
BEGIN
    FOR row IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- RLS'yi aktif et
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', row.tablename);
        
        -- Önceki genel kuralları temizle (çakışmaması için, opsiyonel ama güvenli)
        EXECUTE format('DROP POLICY IF EXISTS "Allow All Authenticated" ON public.%I;', row.tablename);
        
        -- Sadece giriş yapmış (Authenticated) kullanıcılara FULL yetki ver
        EXECUTE format('
            CREATE POLICY "Allow All Authenticated" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (true) 
            WITH CHECK (true);
        ', row.tablename);
    END LOOP;
END $$;
