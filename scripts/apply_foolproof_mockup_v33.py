import os
import re

supabase_path = "frontend/src/lib/supabaseService.ts"

if os.path.exists(supabase_path):
    with open(supabase_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for the exact line in updateSejour: hotel_id: room.hotelId,
    # Be careful not to replace createSejour again, though createSejour has hotel_id: room.hotelId || null,
    
    # We can match hotel_id: room.hotelId, followed by \n
    update_pattern = re.compile(r'(hotel_id:\s*room\.hotelId,)\n')
    content = update_pattern.sub(r'\1\n            supplier_id: room.supplierId || null,\n            check_in_date: room.checkInDate || null,\n            check_out_date: room.checkOutDate || null,\n', content)

    with open(supabase_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"SUCCESSFULLY APPLIED V33 UPDATE_SEJOUR MAPPINGS IN {supabase_path}")
