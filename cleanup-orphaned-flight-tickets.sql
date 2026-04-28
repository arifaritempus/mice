-- PROJE İLE İLİŞKİLİ OLMAYAN UÇAK BİLETLERİNİ TEMİZLEME
-- Supabase SQL Editor'da çalıştırın

-- 1. Önce kontrol: Proje ile ilişkili olmayan biletleri göster
-- project_id NULL olan biletler
SELECT 
    'NULL project_id' as problem_type,
    COUNT(*) as count,
    array_agg(id::text) as ticket_ids
FROM project_flight_tickets
WHERE project_id IS NULL

UNION ALL

-- Geçersiz project_id'ye sahip biletler (projects tablosunda olmayan)
SELECT 
    'Invalid project_id' as problem_type,
    COUNT(*) as count,
    array_agg(pft.id::text) as ticket_ids
FROM project_flight_tickets pft
LEFT JOIN projects p ON pft.project_id = p.id
WHERE pft.project_id IS NOT NULL AND p.id IS NULL;

-- 2. Detaylı rapor: Hangi biletler sorunlu?
SELECT 
    pft.id,
    pft.project_id,
    pft.tedarikci,
    pft.havayolu,
    pft.pnr,
    pft.ucus_tipi,
    pft.created_at,
    CASE 
        WHEN pft.project_id IS NULL THEN 'NULL project_id'
        WHEN p.id IS NULL THEN 'Invalid project_id'
        ELSE 'OK'
    END as status
FROM project_flight_tickets pft
LEFT JOIN projects p ON pft.project_id = p.id
WHERE pft.project_id IS NULL OR p.id IS NULL
ORDER BY pft.created_at DESC;

-- 3. TEMİZLEME: Proje ile ilişkili olmayan biletleri sil
-- DİKKAT: Bu işlem geri alınamaz! Önce yukarıdaki sorguları çalıştırıp kontrol edin.

-- NULL project_id olan biletleri sil
DELETE FROM project_flight_tickets
WHERE project_id IS NULL;

-- Geçersiz project_id'ye sahip biletleri sil
DELETE FROM project_flight_tickets pft
WHERE pft.project_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM projects p WHERE p.id = pft.project_id
);

-- 4. Temizleme sonrası kontrol
SELECT 
    COUNT(*) as total_tickets,
    COUNT(DISTINCT project_id) as unique_projects,
    COUNT(CASE WHEN project_id IS NULL THEN 1 END) as null_project_ids,
    COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = project_flight_tickets.project_id) THEN 1 END) as invalid_project_ids
FROM project_flight_tickets;

-- 5. Başarı mesajı
SELECT 'Temizleme işlemi tamamlandı!' as message;

