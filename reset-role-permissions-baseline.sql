-- Dikkat: Bu script role_permissions'i baseline'e resetler.
-- Super Admin = tum izinler
-- Admin = tum modullerde view/create/edit/delete (istersen sonra daralt)
-- Manager = view + create/edit (kritik modullerde), delete yok
-- User = sinirli view
-- Viewer = temel view

begin;

-- 1) Kullanici rollerini role.id formatina normalize et
update public.users u
set role = r.id
from public.roles r
where lower(trim(coalesce(u.role, ''))) = lower(trim(coalesce(r.name, '')))
  and coalesce(u.role, '') <> coalesce(r.id, '');

-- 2) role_permissions'i tamamen temizle
delete from public.role_permissions;

-- 3) Super Admin => tum aktif permissionlar
insert into public.role_permissions(role_id, permission_id)
select 'super_admin', p.id
from public.permissions p
where p.is_active = true
on conflict do nothing;

-- 4) Admin => tum aktif permissionlar
insert into public.role_permissions(role_id, permission_id)
select 'admin', p.id
from public.permissions p
where p.is_active = true
on conflict do nothing;

-- 5) Manager => view + create + edit (delete yok)
insert into public.role_permissions(role_id, permission_id)
select 'manager', p.id
from public.permissions p
where p.is_active = true
  and p.action in ('view','create','edit')
on conflict do nothing;

-- 6) User => sadece belirli modullerde view
insert into public.role_permissions(role_id, permission_id)
select 'user', p.id
from public.permissions p
where p.is_active = true
  and p.action = 'view'
  and p.module in ('dashboard','quotes','projects','agencies','hotels','reports','profile')
on conflict do nothing;

-- 7) Viewer => sadece temel view
insert into public.role_permissions(role_id, permission_id)
select 'viewer', p.id
from public.permissions p
where p.is_active = true
  and p.action = 'view'
  and p.module in ('dashboard','reports','profile')
on conflict do nothing;

commit;

-- Kontrol: Efektif izin matrisi
-- select rp.role_id, p.module, p.action
-- from public.role_permissions rp
-- join public.permissions p on p.id = rp.permission_id
-- where p.is_active = true
-- order by rp.role_id, p.module, p.action;
