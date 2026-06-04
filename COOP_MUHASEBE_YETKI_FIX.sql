-- COOP EVENT MUHASEBE YETKILENDIRME VE SUPER ADMIN GUNCELLEMESI

-- 1. Sizin hesabınızı tam yetkili (super_admin) yapalım
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'arif.ari@tempustravel.co';

-- 2. Eğer yetkilendirme tablosunda Admin ve Manager için muhasebe yetkileri yoksa ekleyelim
DO $$ 
DECLARE
    r RECORD;
    v_role_id UUID;
    v_perm_id UUID;
    role_name TEXT;
    mod_name TEXT;
    act_name TEXT;
BEGIN
    -- Eğer eski sistem kullanılıyorsa (role_permissions)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        
        -- Admin ve Manager rolleri için döngü
        FOR role_name IN SELECT unnest(ARRAY['admin', 'manager']) LOOP
            
            -- İlgili rolün ID'sini bul
            SELECT id INTO v_role_id FROM public.roles WHERE key = role_name LIMIT 1;
            
            IF v_role_id IS NOT NULL THEN
                -- Modüller ve yetkiler için döngü
                FOR mod_name IN SELECT unnest(ARRAY['accounting', 'cash_flow', 'invoices', 'exchange_rates']) LOOP
                    FOR act_name IN SELECT unnest(ARRAY['view', 'create', 'edit', 'delete']) LOOP
                        
                        -- Permission (yetki) tanımı var mı kontrol et, yoksa oluştur
                        SELECT id INTO v_perm_id FROM public.permissions WHERE module = mod_name AND action = act_name LIMIT 1;
                        IF v_perm_id IS NULL THEN
                            INSERT INTO public.permissions (module, action, description) 
                            VALUES (mod_name, act_name, mod_name || ' modülü için ' || act_name || ' yetkisi')
                            RETURNING id INTO v_perm_id;
                        END IF;
                        
                        -- Role bu yetkiyi ata
                        IF NOT EXISTS (SELECT 1 FROM public.role_permissions WHERE role_id = v_role_id AND permission_id = v_perm_id) THEN
                            INSERT INTO public.role_permissions (role_id, permission_id) VALUES (v_role_id, v_perm_id);
                        END IF;
                        
                    END LOOP;
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    -- Eğer yeni sistem kullanılıyorsa (sadece permissions tablosunda role sütunu varsa)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'role') THEN
        FOR role_name IN SELECT unnest(ARRAY['admin', 'manager']) LOOP
            FOR mod_name IN SELECT unnest(ARRAY['accounting', 'cash_flow', 'invoices']) LOOP
                FOR act_name IN SELECT unnest(ARRAY['view', 'create', 'edit', 'delete']) LOOP
                    IF NOT EXISTS (SELECT 1 FROM public.permissions WHERE role = role_name AND module = mod_name AND permission_type = act_name) THEN
                        INSERT INTO public.permissions (role, module, permission_type, is_granted)
                        VALUES (role_name, mod_name, act_name, true);
                    END IF;
                END LOOP;
            END LOOP;
        END LOOP;
    END IF;

END $$;
