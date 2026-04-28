-- Grup transferlerini test et
-- Bu kodu Supabase SQL Editor'da çalıştır

-- 1. Grup transferlerini kontrol et
SELECT 
    id,
    project_id,
    direction,
    type_label,
    is_group,
    group_transfers,
    passenger_count,
    passengers,
    created_at
FROM project_transfer_tour 
WHERE is_group = true 
ORDER BY created_at DESC;

-- 2. Grup transferlerinin JSON detaylarını kontrol et
SELECT 
    id,
    type_label,
    is_group,
    group_transfers,
    CASE 
        WHEN group_transfers IS NOT NULL 
        THEN jsonb_array_length(group_transfers::jsonb)
        ELSE 0 
    END as group_count
FROM project_transfer_tour 
WHERE is_group = true;

-- 3. Tüm transferleri kontrol et (grup ve normal)
SELECT 
    id,
    direction,
    type_label,
    is_group,
    passenger_count,
    CASE 
        WHEN is_group = true THEN 'GRUP'
        ELSE 'NORMAL'
    END as transfer_type,
    created_at
FROM project_transfer_tour 
ORDER BY created_at DESC;
