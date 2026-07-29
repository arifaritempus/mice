import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add expandedSection state
    if "const [expandedSection, setExpandedSection]" not in content:
        content = re.sub(
            r'(const \[showAccommodation, setShowAccommodation\] = useState\(true\);)',
            r'\1\n  const [expandedSection, setExpandedSection] = useState<string | null>(null);',
            content
        )

    # 2. Add parseAmount
    if "const parseAmount = (" not in content:
        content = re.sub(
            r'(const parseTrAmount = [^\{]+\{[^\}]+\})',
            r'\1\n\n  const parseAmount = (val: string) => { return parseTrAmount(val); };',
            content
        )

    # 3. Add date to ExtraService
    if "date?: string" not in content and "date: string" not in content:
        content = re.sub(
            r'(interface ExtraService \{\n\s*id: string;)',
            r'\1\n  date?: string;',
            content
        )

    # 4. Fix hotelRoomTypes (maybe it was roomTypes?)
    # Let's just define it if it's missing, or change hotelRoomTypes to roomTypes.
    # We will change hotelRoomTypes to roomTypes in the script.
    content = content.replace('hotelRoomTypes.map', 'roomTypes.map')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

