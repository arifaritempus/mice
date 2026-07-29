import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v21(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Search for Tedarikçi dropdown options and change it
    old_code = """<SearchableSelect
                                  options={suppliers || []}
                                  value={room.supplierId || ""}"""
    new_code = """<SearchableSelect
                                  options={[...(suppliers || []), ...(hotels || [])]}
                                  value={room.supplierId || ""}"""
    
    # We might have `(room as any).supplierId` in some places depending on if TypeScript is angry
    old_code_alt = """<SearchableSelect
                                  options={suppliers || []}
                                  value={(room as any).supplierId || ""}"""
    new_code_alt = """<SearchableSelect
                                  options={[...(suppliers || []), ...(hotels || [])]}
                                  value={(room as any).supplierId || ""}"""

    # If it was injected by v20, it probably has `value={room.supplierId || ""}` (since we added it to interface Room)
    content = content.replace(old_code, new_code)
    content = content.replace(old_code_alt, new_code_alt)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY UPDATED TEDARIKCI OPTIONS IN {filepath}")

for fp in files:
    apply_v21(fp)
