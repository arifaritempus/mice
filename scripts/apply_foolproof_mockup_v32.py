import os
import re

supabase_path = "frontend/src/lib/supabaseService.ts"

if os.path.exists(supabase_path):
    with open(supabase_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update room mapping in getSejourWithDetails
    # Look for: hotelId: room.hotel_id || room.hotelId,
    room_pattern = re.compile(r'(hotelId:\s*room\.hotel_id\s*\|\|\s*room\.hotelId,)')
    content = room_pattern.sub(r'\1\n        supplierId: room.supplier_id || room.supplierId || "",\n        checkInDate: room.check_in_date || room.checkInDate || "",\n        checkOutDate: room.check_out_date || room.checkOutDate || "",', content)
    
    # 2. Update extraServices mapping
    # Look for: supplierId: service.supplier_id,
    extra_pattern = re.compile(r'(supplierId:\s*service\.supplier_id,)')
    content = extra_pattern.sub(r'\1\n        date: service.date || "",', content)

    with open(supabase_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"SUCCESSFULLY APPLIED V32 SUPABASE GETTER MAPPINGS IN {supabase_path}")
