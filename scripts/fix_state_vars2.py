import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add date to ExtraService
    if "date?: string;" not in content:
        content = content.replace(
            "interface ExtraService {\n  id: string;",
            "interface ExtraService {\n  id: string;\n  date?: string;"
        )

    # 2. Add expandedSection
    if "const [expandedSection, setExpandedSection]" not in content:
        content = content.replace(
            "const [showAccommodation, setShowAccommodation] = useState(false);",
            "const [showAccommodation, setShowAccommodation] = useState(false);\n  const [expandedSection, setExpandedSection] = useState<string | null>(null);"
        )

    # 3. Add parseAmount alias for parseTrAmount
    if "const parseAmount =" not in content:
        content = content.replace(
            "const parseTrAmount = (val: string) => {",
            "const parseAmount = (val: string) => parseTrAmount(val);\n  const parseTrAmount = (val: string) => {"
        )
        
    # 4. Fix hotelRoomTypes array name
    content = content.replace("hotelRoomTypes.map", "roomTypes.map")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed state variables.")
