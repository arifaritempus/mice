-- Ödeme Tabı için Supabase Tabloları
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Proje Ödeme Planları Tablosu (Alış Ödeme Planı)
CREATE TABLE IF NOT EXISTS project_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  hotel TEXT, -- Otel/Tedarikçi adı (display için)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Proje Ödemeler Tablosu (Yapılan Ödemeler)
CREATE TABLE IF NOT EXISTS project_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  payee TEXT, -- Ödenen kişi/firma
  hotel TEXT, -- Otel/Tedarikçi adı (display için)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mevcut tablolara kolon ekleme (eğer tablolar zaten varsa)
ALTER TABLE project_payment_plans 
  ADD COLUMN IF NOT EXISTS hotel TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;

ALTER TABLE project_payments 
  ADD COLUMN IF NOT EXISTS hotel TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_project ON project_payment_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_date ON project_payment_plans(date);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_supplier ON project_payment_plans(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_hotel ON project_payment_plans(hotel_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_project ON project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_date ON project_payments(date);
CREATE INDEX IF NOT EXISTS idx_project_payments_supplier ON project_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_hotel ON project_payments(hotel_id);

-- RLS (Row Level Security) Politikaları
ALTER TABLE project_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil (eğer varsa)
DROP POLICY IF EXISTS "Users can view payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can insert payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can update payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can delete payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can view payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can insert payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can update payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can delete payments for their projects" ON project_payments;

-- Proje sahipleri ve proje kullanıcıları okuyabilir/yazabilir
CREATE POLICY "Users can view payment plans for their projects"
  ON project_payment_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert payment plans for their projects"
  ON project_payment_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payment plans for their projects"
  ON project_payment_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payment plans for their projects"
  ON project_payment_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Aynı politikaları payments tablosu için de oluştur
CREATE POLICY "Users can view payments for their projects"
  ON project_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert payments for their projects"
  ON project_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payments for their projects"
  ON project_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payments for their projects"
  ON project_payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Mevcut trigger'ları sil (eğer varsa)
DROP TRIGGER IF EXISTS update_project_payment_plans_updated_at ON project_payment_plans;
DROP TRIGGER IF EXISTS update_project_payments_updated_at ON project_payments;

-- Updated_at trigger'ları
CREATE TRIGGER update_project_payment_plans_updated_at
  BEFORE UPDATE ON project_payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_payments_updated_at
  BEFORE UPDATE ON project_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

