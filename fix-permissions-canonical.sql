-- Yetkilendirme sistemini canonical module/action yapisina getirir.
-- Guvenli calisma: once upsert yapar, sonra role_permissions iliskilerini garanti eder.
-- NOT: Bu script, "roles", "permissions", "role_permissions" tablolari oldugu varsayimiyla yazilmistir.

begin;

-- 1) Canonical permissions listesi
with canonical(module, action, description) as (
  values
    ('dashboard','view','Dashboard görüntüleme'),
    ('quotes','view','Teklif görüntüleme'),
    ('quotes','create','Teklif oluşturma'),
    ('quotes','edit','Teklif düzenleme'),
    ('quotes','delete','Teklif silme'),
    ('projects','view','Proje görüntüleme'),
    ('projects','create','Proje oluşturma'),
    ('projects','edit','Proje düzenleme'),
    ('projects','delete','Proje silme'),
    ('budget','view','Bütçe görüntüleme'),
    ('budget','create','Bütçe oluşturma'),
    ('budget','edit','Bütçe düzenleme'),
    ('budget','delete','Bütçe silme'),
    ('agencies','view','Acenta görüntüleme'),
    ('agencies','create','Acenta oluşturma'),
    ('agencies','edit','Acenta düzenleme'),
    ('agencies','delete','Acenta silme'),
    ('hotels','view','Otel görüntüleme'),
    ('hotels','create','Otel oluşturma'),
    ('hotels','edit','Otel düzenleme'),
    ('hotels','delete','Otel silme'),
    ('categories','view','Kategori görüntüleme'),
    ('categories','create','Kategori oluşturma'),
    ('categories','edit','Kategori düzenleme'),
    ('categories','delete','Kategori silme'),
    ('users','view','Kullanıcı görüntüleme'),
    ('users','create','Kullanıcı oluşturma'),
    ('users','edit','Kullanıcı düzenleme'),
    ('users','delete','Kullanıcı silme'),
    ('reports','view','Rapor görüntüleme'),
    ('settings','view','Ayar görüntüleme'),
    ('settings','edit','Ayar düzenleme'),
    ('sejour','view','Sejour görüntüleme'),
    ('sejour','create','Sejour oluşturma'),
    ('sejour','edit','Sejour düzenleme'),
    ('sejour','delete','Sejour silme'),
    ('operations','view','Operasyon görüntüleme'),
    ('operations','create','Operasyon oluşturma'),
    ('operations','edit','Operasyon düzenleme'),
    ('operations','delete','Operasyon silme'),
    ('suppliers','view','Tedarikçi görüntüleme'),
    ('suppliers','create','Tedarikçi oluşturma'),
    ('suppliers','edit','Tedarikçi düzenleme'),
    ('suppliers','delete','Tedarikçi silme'),
    ('tickets','view','Bilet görüntüleme'),
    ('tickets','create','Bilet oluşturma'),
    ('tickets','edit','Bilet düzenleme'),
    ('tickets','delete','Bilet silme'),
    ('events','view','Etkinlik görüntüleme'),
    ('events','create','Etkinlik oluşturma'),
    ('events','edit','Etkinlik düzenleme'),
    ('events','delete','Etkinlik silme'),
    ('profile','view','Profil görüntüleme'),
    ('profile','edit','Profil düzenleme')
)
insert into public.permissions(module, action, description, is_active)
select c.module, c.action, c.description, true
from canonical c
on conflict (module, action) do update
set description = excluded.description,
    is_active = true;

-- 2) Canonical rollerin varligini garanti et
insert into public.roles(id, name, description, is_active)
values
  ('super_admin','Süper Admin','Tüm yetkilere sahiptir',true),
  ('admin','Admin','Geniş yönetim yetkileri',true),
  ('manager','Müdür','Orta seviye yönetim yetkileri',true),
  ('user','Kullanıcı','Sınırlı kullanıcı yetkileri',true),
  ('viewer','Görüntüleyici','Salt görüntüleme',true)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true;

-- 3) role_permissions unique constraint yoksa olustur
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'role_permissions_role_id_permission_id_key'
  ) then
    alter table public.role_permissions
      add constraint role_permissions_role_id_permission_id_key unique(role_id, permission_id);
  end if;
end $$;

-- 4) Super admin'e tum permission'lari ver
insert into public.role_permissions(role_id, permission_id)
select 'super_admin', p.id
from public.permissions p
on conflict (role_id, permission_id) do nothing;

-- 5) Legacy modulleri canonical modullere role_permissions bazinda migrate et
--    (home->dashboard, mice->quotes, accounting->projects, vb.)
with legacy_map(old_module, new_module) as (
  values
    ('home','dashboard'),
    ('mice','quotes'),
    ('accounting','projects'),
    ('budgets','budget'),
    ('otel','hotels'),
    ('proje','projects'),
    ('service_types','suppliers'),
    ('service-types','suppliers')
),
legacy_permissions as (
  select p.id as legacy_permission_id, p.module as old_module, p.action
  from public.permissions p
  join legacy_map lm on lm.old_module = p.module
),
canonical_permissions as (
  select p.id as canonical_permission_id, lm.old_module, lm.new_module, p.action
  from public.permissions p
  join legacy_map lm on lm.new_module = p.module
),
role_permission_to_copy as (
  select
    rp.role_id,
    cp.canonical_permission_id as permission_id
  from public.role_permissions rp
  join legacy_permissions lp on lp.legacy_permission_id = rp.permission_id
  join canonical_permissions cp
    on cp.old_module = lp.old_module
   and cp.action = lp.action
)
insert into public.role_permissions(role_id, permission_id)
select distinct role_id, permission_id
from role_permission_to_copy
on conflict (role_id, permission_id) do nothing;

-- 6) Legacy modullere bagli eski role_permissions kayitlarini temizle
delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.module in ('home','mice','accounting','budgets','otel','proje','service_types','service-types');

-- 7) Legacy permission kayitlarini pasiflestir
update public.permissions
set is_active = false
where module in ('home','mice','accounting','budgets','otel','proje','service_types','service-types');

commit;

-- 8) Kontrol sorgusu (manual):
-- select module, action, is_active
-- from public.permissions
-- where module in ('home','mice','accounting','budgets','otel','proje','service_types','service-types')
-- order by module, action;
