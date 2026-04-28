-- Supabase Storage 'logos' bucket'ı için RLS politikaları
-- NOT: Bu script bazı Supabase projelerinde çalışmayabilir
-- Eğer hata alırsanız, Supabase Dashboard'dan manuel olarak ekleyin

-- Storage objects tablosu için RLS politikaları
-- NOT: Eğer "must be owner" hatası alırsanız, bu politikaları
-- Supabase Dashboard > Storage > logos bucket > Policies sekmesinden manuel olarak ekleyin

-- Policy 1: Authenticated users can upload logos (INSERT)
-- Policy name: "Authenticated users can upload logos"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression: bucket_id = 'logos'

-- Policy 2: Authenticated users can read logos (SELECT)
-- Policy name: "Authenticated users can read logos"
-- Allowed operation: SELECT
-- Target roles: authenticated
-- USING expression: bucket_id = 'logos'

-- Policy 3: Authenticated users can update logos (UPDATE)
-- Policy name: "Authenticated users can update logos"
-- Allowed operation: UPDATE
-- Target roles: authenticated
-- USING expression: bucket_id = 'logos'
-- WITH CHECK expression: bucket_id = 'logos'

-- Policy 4: Authenticated users can delete logos (DELETE)
-- Policy name: "Authenticated users can delete logos"
-- Allowed operation: DELETE
-- Target roles: authenticated
-- USING expression: bucket_id = 'logos'

-- Policy 5: Public can read logos (SELECT)
-- Policy name: "Public can read logos"
-- Allowed operation: SELECT
-- Target roles: public
-- USING expression: bucket_id = 'logos'

