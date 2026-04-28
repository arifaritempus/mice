-- BİLET OPSİYON TAKİP TABLOSU
-- Supabase SQL Editor'da çalıştırın

-- 1. Bilet opsiyonları tablosunu oluştur
CREATE TABLE IF NOT EXISTS ticket_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_no VARCHAR(255) NOT NULL,
    agent VARCHAR(255),
    company_name VARCHAR(255),
    supplier VARCHAR(255),
    airline VARCHAR(50),
    group_ref_no VARCHAR(255),
    flight_type VARCHAR(50), -- 'Gidiş', 'Dönüş', 'Gidiş Dönüş'
    departure_date DATE,
    departure_time TIME,
    return_date DATE,
    return_time TIME,
    route VARCHAR(255),
    passenger_count INTEGER DEFAULT 0,
    pp_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    option_end_date DATE,
    option_end_time TIME,
    pnr VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'confirmed', 'cancelled'
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_ticket_options_voucher_no ON ticket_options(voucher_no);
CREATE INDEX IF NOT EXISTS idx_ticket_options_agent ON ticket_options(agent);
CREATE INDEX IF NOT EXISTS idx_ticket_options_supplier ON ticket_options(supplier);
CREATE INDEX IF NOT EXISTS idx_ticket_options_status ON ticket_options(status);
CREATE INDEX IF NOT EXISTS idx_ticket_options_departure_date ON ticket_options(departure_date);
CREATE INDEX IF NOT EXISTS idx_ticket_options_option_end_date ON ticket_options(option_end_date);

-- 3. RLS'yi etkinleştir
ALTER TABLE ticket_options ENABLE ROW LEVEL SECURITY;

-- 4. RLS politikalarını oluştur
-- Tüm kullanıcılar bilet opsiyonlarını görebilir (VIEW yetkisi varsa)
CREATE POLICY "Users can view ticket options" ON ticket_options
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'view'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonu ekleyebilir (CREATE yetkisi varsa)
CREATE POLICY "Users can create ticket options" ON ticket_options
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'create'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonunu güncelleyebilir (EDIT yetkisi varsa)
CREATE POLICY "Users can update ticket options" ON ticket_options
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'edit'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonunu silebilir (DELETE yetkisi varsa)
CREATE POLICY "Users can delete ticket options" ON ticket_options
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'delete'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- 5. updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_ticket_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_options_updated_at
    BEFORE UPDATE ON ticket_options
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_options_updated_at();

















