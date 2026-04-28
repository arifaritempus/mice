-- Public Links Tablosu
-- Bu script Supabase SQL Editor'da çalıştırılmalıdır

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type TEXT NOT NULL CHECK (link_type IN ('quote', 'project')),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  approval JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- En az bir ID olmalı (quote_id veya project_id)
  CONSTRAINT check_reference CHECK (
    (link_type = 'quote' AND quote_id IS NOT NULL AND project_id IS NULL) OR
    (link_type = 'project' AND project_id IS NOT NULL AND quote_id IS NULL)
  )
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_public_links_token ON public_links(token);
CREATE INDEX IF NOT EXISTS idx_public_links_quote_id ON public_links(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_public_links_project_id ON public_links(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_public_links_link_type ON public_links(link_type);
CREATE INDEX IF NOT EXISTS idx_public_links_is_active ON public_links(is_active);
CREATE INDEX IF NOT EXISTS idx_public_links_created_by ON public_links(created_by);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_public_links_updated_at
  BEFORE UPDATE ON public_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Politikaları
ALTER TABLE public_links ENABLE ROW LEVEL SECURITY;

-- Herkes token ile link okuyabilir (public view için)
CREATE POLICY "Public links are viewable by token"
  ON public_links
  FOR SELECT
  USING (true);

-- Sadece authenticated kullanıcılar link oluşturabilir
CREATE POLICY "Authenticated users can create links"
  ON public_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Herkes approval güncelleyebilir (public view için - token ile doğrulama yapılır)
-- Not: Bu policy tüm UPDATE işlemlerini kapsar (public view için gerekli)
CREATE POLICY "Anyone can update approval via token"
  ON public_links
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Sadece link sahibi veya admin link silebilir
CREATE POLICY "Users can delete their own links"
  ON public_links
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin')
    )
  );

-- Yorumlar
COMMENT ON TABLE public_links IS 'Public preview links for quotes and projects';
COMMENT ON COLUMN public_links.link_type IS 'Type of link: quote or project';
COMMENT ON COLUMN public_links.token IS 'Unique token for public access';
COMMENT ON COLUMN public_links.password IS 'Password for link protection';
COMMENT ON COLUMN public_links.approval IS 'Agreement approval data (name, email, date, IP)';

