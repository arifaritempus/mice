-- Tahsilat Tabı için Supabase Tabloları
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Proje Tahsilat Planları Tablosu (Ödeme Planı - Sözleşme)
CREATE TABLE IF NOT EXISTS project_collection_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  collection_type TEXT CHECK (collection_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Proje Tahsilatlar Tablosu (Alınan Tahsilatlar)
CREATE TABLE IF NOT EXISTS project_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  collection_type TEXT CHECK (collection_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  payer TEXT, -- Ödeyen kişi/firma
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_collection_plans_project ON project_collection_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collection_plans_date ON project_collection_plans(date);
CREATE INDEX IF NOT EXISTS idx_project_collections_project ON project_collections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collections_date ON project_collections(date);

-- RLS (Row Level Security) Politikaları
ALTER TABLE project_collection_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collections ENABLE ROW LEVEL SECURITY;

-- Proje sahipleri ve proje kullanıcıları okuyabilir/yazabilir
CREATE POLICY "Users can view collection plans for their projects"
  ON project_collection_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert collection plans for their projects"
  ON project_collection_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update collection plans for their projects"
  ON project_collection_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete collection plans for their projects"
  ON project_collection_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Aynı politikaları collections tablosu için de oluştur
CREATE POLICY "Users can view collections for their projects"
  ON project_collections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert collections for their projects"
  ON project_collections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update collections for their projects"
  ON project_collections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete collections for their projects"
  ON project_collections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE TRIGGER update_project_collection_plans_updated_at
  BEFORE UPDATE ON project_collection_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_collections_updated_at
  BEFORE UPDATE ON project_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


