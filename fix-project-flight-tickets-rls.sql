-- PROJECT FLIGHT TICKETS RLS POLİTİKALARINI DÜZELT
-- Backend service role key kullanıyor, bu yüzden RLS authenticated kullanıcılar için esnek olmalı

-- Mevcut politikaları sil
DROP POLICY IF EXISTS "Users can view project flight tickets if project member" ON project_flight_tickets;
DROP POLICY IF EXISTS "Users can insert project flight tickets if project member" ON project_flight_tickets;
DROP POLICY IF EXISTS "Users can update project flight tickets if project member" ON project_flight_tickets;
DROP POLICY IF EXISTS "Users can delete project flight tickets if project member" ON project_flight_tickets;

-- Yeni politikalar: Authenticated kullanıcılar tüm işlemleri yapabilir
-- (Backend service role key kullanıyor, frontend'de usePermissions ile yetkilendirme yapılıyor)

-- SELECT: Authenticated kullanıcılar görebilir
CREATE POLICY "Authenticated users can view project flight tickets" ON project_flight_tickets
    FOR SELECT 
    TO authenticated
    USING (true);

-- INSERT: Authenticated kullanıcılar ekleyebilir
CREATE POLICY "Authenticated users can insert project flight tickets" ON project_flight_tickets
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- UPDATE: Authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Authenticated users can update project flight tickets" ON project_flight_tickets
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: Authenticated kullanıcılar silebilir
CREATE POLICY "Authenticated users can delete project flight tickets" ON project_flight_tickets
    FOR DELETE 
    TO authenticated
    USING (true);

-- Başarı mesajı
SELECT 'project_flight_tickets RLS politikaları güncellendi!' as message;

