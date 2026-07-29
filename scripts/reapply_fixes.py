import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Room interface
    content = re.sub(
        r'interface Room \{\n\s*id: string;\n\s*roomNumber: string;\n\s*hotelId: string;',
        'interface Room {\n  id: string;\n  roomNumber: string;\n  hotelId: string;\n  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;',
        content
    )

    # 2. Add Enter key listener to price inputs
    content = re.sub(
        r'(onBlur=\{\(e\) => \{[^\}]+\}\s*\})',
        r'\1\n                                  onKeyDown={(e) => {\n                                    if (e.key === "Enter") {\n                                      e.preventDefault();\n                                      const parsed = parseTrAmount((e.target as HTMLInputElement).value);\n                                      updateRoom(room.id, "price", parsed);\n                                      setRoomPriceInput((prev) => ({ ...prev, [room.id]: formatAmount(parsed) }));\n                                    }\n                                  }}',
        content
    )

    # 3. Format the dates in the sejour block
    content = re.sub(
        r'new Date\(salesData\.checkInDate\)\.toLocaleDateString\(\s*"en-US"\s*,\s*\{\s*year:\s*"numeric",\s*month:\s*"short",\s*day:\s*"numeric"\s*\}\s*\)',
        r'new Date(salesData.checkInDate).toLocaleDateString("tr-TR")',
        content
    )
    content = re.sub(
        r'new Date\(salesData\.checkOutDate\)\.toLocaleDateString\(\s*"en-US"\s*,\s*\{\s*year:\s*"numeric",\s*month:\s*"short",\s*day:\s*"numeric"\s*\}\s*\)',
        r'new Date(salesData.checkOutDate).toLocaleDateString("tr-TR")',
        content
    )
    content = re.sub(
        r'new Date\(salesData\.creationDate\)\.toLocaleDateString\(\s*"en-US"\s*,\s*\{\s*year:\s*"numeric",\s*month:\s*"short",\s*day:\s*"numeric"\s*\}\s*\)',
        r'new Date(salesData.creationDate).toLocaleDateString("tr-TR")',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Applied quick fixes to pages.")
