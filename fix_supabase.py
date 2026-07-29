import re
supabase_file = "frontend/src/lib/supabaseService.ts"
with open(supabase_file, 'r', encoding='utf-8') as f:
    sb = f.read()

# createSejour
sb = re.sub(
    r'(room_number:\s*room\.roomNumber \|\| null,)',
    r'\1\n          supplier_id: room.supplierId || null,\n          check_in: room.checkIn || null,\n          check_out: room.checkOut || null,',
    sb
)

# getAllSejours / getSejourById map
sb = re.sub(
    r'(roomNumber:\s*room\.room_number \|\| room\.roomNumber,)',
    r'\1\n        supplierId: room.supplier_id || room.supplierId || "",\n        checkIn: room.check_in || room.checkIn || "",\n        checkOut: room.check_out || room.checkOut || "",',
    sb
)

with open(supabase_file, 'w', encoding='utf-8') as f:
    f.write(sb)
