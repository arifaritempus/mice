-- EKSİK MUHASEBE VE DÖVİZ KURLARI YETKİLERİNİN SİSTEME EKLENMESİ

DO $$ 
DECLARE
    mod_name TEXT;
    act_name TEXT;
    v_perm_id UUID;
BEGIN
    -- Eğer eski sistem (action sütunu olan) kullanılıyorsa
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'action') THEN
        
        -- Modüller ve yetkiler için döngü
        FOR mod_name IN SELECT unnest(ARRAY['accounting', 'exchange_rates']) LOOP
            FOR act_name IN SELECT unnest(ARRAY['view', 'create', 'edit', 'delete']) LOOP
                
                -- Yetki (Permission) sistemde var mı kontrol et
                SELECT id INTO v_perm_id FROM public.permissions WHERE module = mod_name AND action = act_name LIMIT 1;
                
                -- Yoksa sisteme ekle
                IF v_perm_id IS NULL THEN
                    INSERT INTO public.permissions (module, action, description) 
                    VALUES (mod_name, act_name, mod_name || ' modülü için ' || act_name || ' yetkisi');
                END IF;
                
            END LOOP;
        END LOOP;
    END IF;

    -- Eğer yeni sistem (permission_type sütunu olan) kullanılıyorsa
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'permission_type') THEN
        -- Her modül ve her yetki tipi için
        FOR mod_name IN SELECT unnest(ARRAY['accounting', 'exchange_rates']) LOOP
            FOR act_name IN SELECT unnest(ARRAY['view', 'create', 'edit', 'delete']) LOOP
                
                -- Sadece Süper Admin için ekleyelim, arayüzden diğer rollere atanabilir
                IF NOT EXISTS (SELECT 1 FROM public.permissions WHERE role = 'super_admin' AND module = mod_name AND permission_type = act_name) THEN
                    INSERT INTO public.permissions (role, module, permission_type, is_granted)
                    VALUES ('super_admin', mod_name, act_name, true);
                END IF;
                
            END LOOP;
        END LOOP;
    END IF;

END $$;
