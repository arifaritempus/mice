-- Dashboard ve Reports modülleri için permission kayıtlarını ekle
-- Bu script Supabase SQL Editor'da çalıştırılmalıdır

-- Dashboard modülü için permission kayıtlarını ekle (eğer yoksa)
INSERT INTO permissions (module, action, description, is_active)
SELECT * FROM (VALUES
('dashboard', 'view', 'Dashboard görüntüleme', true),
('dashboard', 'create', 'Dashboard oluşturma', true),
('dashboard', 'edit', 'Dashboard düzenleme', true),
('dashboard', 'delete', 'Dashboard silme', true)
) AS v(module, action, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p WHERE p.module = v.module AND p.action = v.action
);

-- Reports modülü için permission kayıtlarını ekle (eğer yoksa)
INSERT INTO permissions (module, action, description, is_active)
SELECT * FROM (VALUES
('reports', 'view', 'Raporlar görüntüleme', true),
('reports', 'create', 'Rapor oluşturma', true),
('reports', 'edit', 'Rapor düzenleme', true),
('reports', 'delete', 'Rapor silme', true)
) AS v(module, action, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p WHERE p.module = v.module AND p.action = v.action
);

-- Events modülü için permission kayıtlarını ekle (eğer yoksa)
INSERT INTO permissions (module, action, description, is_active)
SELECT * FROM (VALUES
('events', 'view', 'Etkinlikler görüntüleme', true),
('events', 'create', 'Etkinlik oluşturma', true),
('events', 'edit', 'Etkinlik düzenleme', true),
('events', 'delete', 'Etkinlik silme', true)
) AS v(module, action, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p WHERE p.module = v.module AND p.action = v.action
);

















