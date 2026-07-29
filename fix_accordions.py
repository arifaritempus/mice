import re

def fix_file(filename):
    with open(filename, "r") as f:
        text = f.read()

    # Change expandedSectionV6 initial state to null
    text = text.replace(
        'const [expandedSectionV6, setExpandedSectionV6] = useState<string | null>("rooms");',
        'const [expandedSectionV6, setExpandedSectionV6] = useState<string | null>(null);'
    )
    # Remove setShowAccommodation(true)
    text = text.replace(
        'if (sejour.rooms.length > 0) setShowAccommodation(true);',
        '// if (sejour.rooms.length > 0) setShowAccommodation(true);'
    )
    with open(filename, "w") as f:
        f.write(text)

fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
fix_file("frontend/src/app/sejour/create/page.tsx")
