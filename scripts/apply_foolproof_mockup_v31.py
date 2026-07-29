import os
import re

supabase_path = "frontend/src/lib/supabaseService.ts"

if os.path.exists(supabase_path):
    with open(supabase_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update room mapping in createSejour and updateSejour
    # Look for: hotel_id: room.hotelId || null,
    room_pattern = re.compile(r'(hotel_id:\s*room\.hotelId\s*\|\|\s*null,)')
    content = room_pattern.sub(r'\1\n          supplier_id: room.supplierId || null,\n          check_in_date: room.checkInDate || null,\n          check_out_date: room.checkOutDate || null,', content)
    
    # 2. Update extraServices mapping
    # Look for: supplier_id: service.provider || service.supplierId || null,
    extra_pattern = re.compile(r'(supplier_id:\s*service\.provider\s*\|\|\s*service\.supplierId\s*\|\|\s*null,)')
    content = extra_pattern.sub(r'\1\n          date: service.date || null,', content)

    with open(supabase_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"SUCCESSFULLY APPLIED V31 SUPABASE MAPPINGS IN {supabase_path}")


# Now fix the read-only display for Giriş - Çıkış Tarihi in edit/page.tsx
edit_page_path = "frontend/src/app/sejour/[id]/edit/page.tsx"
if os.path.exists(edit_page_path):
    with open(edit_page_path, 'r', encoding='utf-8') as f:
        edit_content = f.read()

    # Look for: {(salesData as any).checkInDate || "-"} - {(salesData as any).checkOutDate || "-"}
    edit_pattern = re.compile(r'\{\(salesData\s*as\s*any\)\.checkInDate\s*\|\|\s*"-"\}\s*-\s*\{\(salesData\s*as\s*any\)\.checkOutDate\s*\|\|\s*"-"\}')
    edit_content = edit_pattern.sub(r'{formatDateDisplay((salesData as any).checkInDate)} - {formatDateDisplay((salesData as any).checkOutDate)}', edit_content)

    with open(edit_page_path, 'w', encoding='utf-8') as f:
        f.write(edit_content)
    print(f"SUCCESSFULLY APPLIED V31 EDIT DISPLAY IN {edit_page_path}")


# Same for create/page.tsx just in case
create_page_path = "frontend/src/app/sejour/create/page.tsx"
if os.path.exists(create_page_path):
    with open(create_page_path, 'r', encoding='utf-8') as f:
        create_content = f.read()

    create_content = edit_pattern.sub(r'{formatDateDisplay((salesData as any).checkInDate)} - {formatDateDisplay((salesData as any).checkOutDate)}', create_content)

    with open(create_page_path, 'w', encoding='utf-8') as f:
        f.write(create_content)
    print(f"SUCCESSFULLY APPLIED V31 CREATE DISPLAY IN {create_page_path}")
