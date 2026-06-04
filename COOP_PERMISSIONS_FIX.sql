-- COOP EVENT YETKILER TABLOSU VE VERI EKLEME

-- 1. UUID eklentisini açalım (id oluşturmak için gerekli)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Eğer permissions tablosu gerçekten yoksa, doğru yapıyla baştan oluşturalım
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Eksik yetkileri tabloya ekleyelim
DO $$ 
DECLARE
    mod_name TEXT;
    act_name TEXT;
    v_perm_id UUID;
BEGIN
    FOR mod_name IN SELECT unnest(ARRAY['accounting', 'exchange_rates']) LOOP
        FOR act_name IN SELECT unnest(ARRAY['view', 'create', 'edit', 'delete']) LOOP
            
            SELECT id INTO v_perm_id FROM public.permissions WHERE module = mod_name AND action = act_name LIMIT 1;
            
            IF v_perm_id IS NULL THEN
                INSERT INTO public.permissions (module, action, description) 
                VALUES (mod_name, act_name, mod_name || ' modülü için ' || act_name || ' yetkisi');
            END IF;
            
        END LOOP;
    END LOOP;
END $$;
