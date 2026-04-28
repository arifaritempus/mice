begin;

-- 1) Auth'tan kullanıcıyı bul
with target_auth_user as (
  select
    id,
    email,
    coalesce(
      nullif(trim((raw_user_meta_data->>'full_name')), ''),
      trim(concat_ws(' ', raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name')),
      split_part(email, '@', 1)
    ) as full_name
  from auth.users
  where lower(email) = 'arif.ari@tempustravel.co'
  limit 1
)
-- 2) public.users'a yoksa ekle, varsa güncelle
insert into public.users (id, email, password_hash, full_name, role, is_active, updated_at)
select
  id,
  email,
  'SUPABASE_AUTH_MANAGED',
  full_name,
  'super_admin',
  true,
  now()
from target_auth_user
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(nullif(public.users.full_name, ''), excluded.full_name),
    password_hash = coalesce(public.users.password_hash, excluded.password_hash),
    role = 'super_admin',
    is_active = true,
    updated_at = now();

-- 3) Email üzerinden eşleşen mevcut satır varsa onu da garantiye al
update public.users
set role = 'super_admin',
    is_active = true,
    updated_at = now()
where lower(email) = 'arif.ari@tempustravel.co';

-- 4) Kontrol: kullanıcı bulundu mu?
do $$
begin
  if not exists (
    select 1
    from public.users
    where lower(email) = 'arif.ari@tempustravel.co'
      and role = 'super_admin'
  ) then
    raise exception 'Kullanıcı public.users tablosunda bulunamadı veya güncellenemedi: arif.ari@tempustravel.co';
  end if;
end $$;

commit;

-- Doğrulama:
-- select id, email, role, is_active
-- from public.users
-- where lower(email) = 'arif.ari@tempustravel.co';
