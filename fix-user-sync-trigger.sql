
-- 1. EKSİK KULLANICILARI SENKRONİZE ET
-- Mevcut auth.users kullanıcılarını public.users tablosuyla ID bazlı eşleştirir.

BEGIN;

-- Eksik kullanıcıları ekle (full_name ve password_hash bypass ile)
INSERT INTO public.users (id, email, full_name, password_hash, role, is_active)
SELECT 
    id, 
    email, 
    COALESCE(
      raw_user_meta_data->>'full_name', 
      TRIM(CONCAT_WS(' ', raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name')),
      split_part(email, '@', 1)
    ), 
    'SUPABASE_AUTH_MANAGED',
    'user', 
    true
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (email) DO UPDATE 
SET id = EXCLUDED.id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

COMMIT;

-- 2. OTOMATİK SENKRONİZASYON İÇİN TRIGGER OLUŞTUR
-- Bu sayede yeni bir kullanıcı kayıt olduğunda public.users tablosuna otomatik eklenir.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, password_hash, role, is_active)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      TRIM(CONCAT_WS(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name')),
      split_part(NEW.email, '@', 1)
    ),
    'SUPABASE_AUTH_MANAGED',
    'user', 
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı ekle
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS POLİTİKALARINI KONTROL ET
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" 
  ON public.users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
