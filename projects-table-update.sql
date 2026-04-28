-- Projeler tablosuna eksik alanları ekle
-- Bu kodu Supabase SQL Editor'de çalıştırın

-- Projeler tablosuna eksik alanları ekle
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id),
ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id),
ADD COLUMN IF NOT EXISTS quote_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS room_count INTEGER,
ADD COLUMN IF NOT EXISTS pax_count INTEGER,
ADD COLUMN IF NOT EXISTS room_pax VARCHAR(100),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Index'leri ekle
CREATE INDEX IF NOT EXISTS idx_projects_reference ON projects(reference);
CREATE INDEX IF NOT EXISTS idx_projects_company_name ON projects(company_name);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_hotel_id ON projects(hotel_id);
CREATE INDEX IF NOT EXISTS idx_projects_quote_type ON projects(quote_type);
CREATE INDEX IF NOT EXISTS idx_projects_confirmed_at ON projects(confirmed_at);

-- RLS Policy'lerini güncelle
-- Projeler için INSERT, UPDATE, DELETE policy'leri ekle
CREATE POLICY "Authenticated users can insert projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Mevcut policy'yi güncelle (eğer varsa)
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
CREATE POLICY "Authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');
