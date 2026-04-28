-- Marketing Module Schema - Düzeltilmiş (Roles/Permissions Sistemi Uyumlu)
-- Bu kodları Supabase SQL Editor'da çalıştırın.

-- 1. Marketing Müşterileri (Firmalar ve Acenteler)
CREATE TABLE IF NOT EXISTS public.marketing_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('firma', 'acenta', 'diger')),
    industry TEXT, -- Sektörü
    website TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    tax_office TEXT,
    tax_number TEXT,
    services TEXT[] DEFAULT '{}', -- mice, sejour, konaklama, uçak bileti, transfer, organizasyon, kongre, vb.
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Marketing Kişileri (Sınırsız ilgili kişi)
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.marketing_clients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    position TEXT, -- Ünvanı
    phone TEXT,
    mobile TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Marketing Etkileşimleri (Görüşmeler, Aramalar, E-postalar, Randevular)
CREATE TABLE IF NOT EXISTS public.marketing_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.marketing_clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.marketing_contacts(id) ON DELETE SET NULL,
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL, -- yüz yüze, online, telefon, e-posta
    status TEXT DEFAULT 'completed', -- completed, planned (appointment), cancelled
    subject TEXT,
    description TEXT, -- Görüşme detayı
    discussed_services TEXT[] DEFAULT '{}', -- mice, sejour, vb.
    appointment_date TIMESTAMPTZ, -- Gelecek randevu tarihi
    user_id UUID REFERENCES auth.users(id), -- Görüşmeyi yapan kullanıcı
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Marketing Notları (İlave notlar)
CREATE TABLE IF NOT EXISTS public.marketing_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.marketing_clients(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES public.marketing_interactions(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Aktifleştirme
ALTER TABLE public.marketing_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_notes ENABLE ROW LEVEL SECURITY;

-- Temel Politikalar (Tüm giriş yapmış kullanıcılar için izin ver)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_clients'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_clients FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_contacts'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_contacts FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_interactions'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_interactions FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_notes'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_notes FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- 5. Yetkiler (Permissions) Tanımlama
-- Mevcut yetki sistemine (permissions ve roles tabloları) uygun ekleme
INSERT INTO public.permissions (module, action, description, is_active)
VALUES 
    ('marketing', 'view', 'Marketing modülü görüntüleme', true),
    ('marketing', 'create', 'Marketing kaydı oluşturma', true),
    ('marketing', 'edit', 'Marketing kaydı düzenleme', true),
    ('marketing', 'delete', 'Marketing kaydı silme', true)
ON CONFLICT (module, action) DO NOTHING;

-- Super Admin rolü için tüm yetkileri ata
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('super_admin', 'Süper Admin')
  AND p.module = 'marketing'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
