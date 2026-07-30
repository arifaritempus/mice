-- Tablo: mice_requests
CREATE TABLE IF NOT EXISTS public.mice_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_date DATE NOT NULL,
    reference TEXT,
    date_type TEXT NOT NULL CHECK (date_type IN ('EXACT', 'FLEXIBLE')),
    date_details JSONB, 
    nights INTEGER,
    room_details JSONB, 
    company_name TEXT,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    meeting JSONB, 
    cocktail JSONB,
    gala JSONB,
    status TEXT DEFAULT 'BEKLEMEDE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tablo: mice_request_hotels (Çoklu Otel Seçimi ve Otel bazlı durum takibi)
CREATE TABLE IF NOT EXISTS public.mice_request_hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.mice_requests(id) ON DELETE CASCADE,
    hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'BEKLEMEDE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Güncelleme Trigger'ı
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mice_requests_modtime
BEFORE UPDATE ON public.mice_requests
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- RLS Politikaları
ALTER TABLE public.mice_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mice_request_hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users on mice_requests"
    ON public.mice_requests FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users on mice_request_hotels"
    ON public.mice_request_hotels FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
