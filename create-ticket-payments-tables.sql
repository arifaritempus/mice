-- BİLET ÖDEME TAKİP TABLOLARI
-- Supabase SQL Editor'da çalıştırın

-- 1. Ödeme Planları Tablosu
CREATE TABLE IF NOT EXISTS ticket_payment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket_options(id) ON DELETE CASCADE,
    installments JSONB NOT NULL, -- [{id, date, percentage, amount, currency}]
    total_amount DECIMAL(15,2) NOT NULL,
    total_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ödeme Kayıtları Tablosu
CREATE TABLE IF NOT EXISTS ticket_payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_plan_id UUID REFERENCES ticket_payment_plans(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES ticket_options(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_transfer', 'cash', 'online'
    notes TEXT,
    recipient VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_ticket_payment_plans_ticket_id ON ticket_payment_plans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_plans_status ON ticket_payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_ticket_id ON ticket_payment_records(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_payment_plan_id ON ticket_payment_records(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_payment_date ON ticket_payment_records(payment_date);

-- 4. RLS'yi etkinleştir
ALTER TABLE ticket_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_payment_records ENABLE ROW LEVEL SECURITY;

-- 5. RLS politikalarını oluştur - Payment Plans
CREATE POLICY "Users can view payment plans" ON ticket_payment_plans
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

CREATE POLICY "Users can create payment plans" ON ticket_payment_plans
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

CREATE POLICY "Users can update payment plans" ON ticket_payment_plans
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

CREATE POLICY "Users can delete payment plans" ON ticket_payment_plans
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

-- 6. RLS politikalarını oluştur - Payment Records
CREATE POLICY "Users can view payment records" ON ticket_payment_records
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

CREATE POLICY "Users can create payment records" ON ticket_payment_records
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

CREATE POLICY "Users can update payment records" ON ticket_payment_records
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

CREATE POLICY "Users can delete payment records" ON ticket_payment_records
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

-- 7. updated_at otomatik güncelleme trigger'ları
CREATE OR REPLACE FUNCTION update_ticket_payment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_payment_plans_updated_at
    BEFORE UPDATE ON ticket_payment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_payment_plans_updated_at();

CREATE OR REPLACE FUNCTION update_ticket_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_payment_records_updated_at
    BEFORE UPDATE ON ticket_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_payment_records_updated_at();

















