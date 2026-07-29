import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Remove duplicate interface properties
    # The duplicate block is exactly:
    #  supplierId?: string;
    #  checkIn?: string;
    #  checkOut?: string;
    content = content.replace("  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;\n  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;", "  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;")

    # 2. Add missing states right after const [activeTab, setActiveTab] = useState("sales");
    if "const [isEditingInfo" not in content:
        content = re.sub(
            r'(const \[activeTab, setActiveTab\] = useState\("sales"\);)',
            r'\1\n  const [isEditingInfo, setIsEditingInfo] = useState(false);\n  const [expandedSection, setExpandedSection] = useState<string | null>(null);',
            content
        )

    # In create/page.tsx it's addRoom = ...
    # Wait, there's a duplicate default value in addRoom / addRoom function?
    content = content.replace("      supplierId: \"\",\n      checkIn: \"\",\n      checkOut: \"\",\n      supplierId: \"\",\n      checkIn: \"\",\n      checkOut: \"\",", "      supplierId: \"\",\n      checkIn: \"\",\n      checkOut: \"\",")

    # In updateRoom
    content = content.replace("              supplierId: value,\n              checkIn: r.checkIn,\n              checkOut: r.checkOut,\n              supplierId: value,\n              checkIn: r.checkIn,\n              checkOut: r.checkOut,", "              supplierId: value,\n              checkIn: r.checkIn,\n              checkOut: r.checkOut,")
    content = content.replace("              checkIn: value,\n              supplierId: r.supplierId,\n              checkOut: r.checkOut,\n              checkIn: value,\n              supplierId: r.supplierId,\n              checkOut: r.checkOut,", "              checkIn: value,\n              supplierId: r.supplierId,\n              checkOut: r.checkOut,")
    content = content.replace("              checkOut: value,\n              supplierId: r.supplierId,\n              checkIn: r.checkIn,\n              checkOut: value,\n              supplierId: r.supplierId,\n              checkIn: r.checkIn,", "              checkOut: value,\n              supplierId: r.supplierId,\n              checkIn: r.checkIn,")


    with open(filepath, 'w') as f:
        f.write(content)

# Fix lib/supabaseService.ts duplicates
supa = "frontend/src/lib/supabaseService.ts"
with open(supa, 'r') as f:
    supa_c = f.read()

supa_c = supa_c.replace("              supplierId: r.supplier_id,\n              checkIn: r.check_in,\n              checkOut: r.check_out,\n              supplierId: r.supplier_id,\n              checkIn: r.check_in,\n              checkOut: r.check_out,", "              supplierId: r.supplier_id,\n              checkIn: r.check_in,\n              checkOut: r.check_out,")

supa_c = supa_c.replace("            supplier_id: room.supplierId,\n            check_in: room.checkIn,\n            check_out: room.checkOut,\n            supplier_id: room.supplierId,\n            check_in: room.checkIn,\n            check_out: room.checkOut,", "            supplier_id: room.supplierId,\n            check_in: room.checkIn,\n            check_out: room.checkOut,")

supa_c = supa_c.replace("              supplierId: r.supplier_id,\n              checkIn: r.check_in,\n              checkOut: r.check_out,\n              supplierId: r.supplier_id,\n              checkIn: r.check_in,\n              checkOut: r.check_out,", "              supplierId: r.supplier_id,\n              checkIn: r.check_in,\n              checkOut: r.check_out,")

with open(supa, 'w') as f:
    f.write(supa_c)
print("Done fixing TS errors")
