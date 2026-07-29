import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx",
    "frontend/src/lib/supabaseService.ts"
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # Create page duplicate properties
    content = re.sub(
        r'(\s*supplierId\??:.*?\n\s*checkIn\??:.*?\n\s*checkOut\??:.*?\n)(?:\1)+',
        r'\1',
        content,
        flags=re.MULTILINE
    )
    
    # Supabase service duplicate properties
    content = re.sub(
        r'(\s*supplier_id\??:.*?\n\s*check_in\??:.*?\n\s*check_out\??:.*?\n)(?:\1)+',
        r'\1',
        content,
        flags=re.MULTILINE
    )

    with open(filepath, 'w') as f:
        f.write(content)

print("Done cleaning duplicates")
