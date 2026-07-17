import re

files = [
    "frontend/src/app/permissions/page.tsx",
    "frontend/src/app/profile/page.tsx"
]

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # ensure Link is imported
    if "import Link from 'next/link'" not in content and 'import Link from "next/link"' not in content:
        content = 'import Link from "next/link";\n' + content
        
    content = content.replace('<a\n            href="/"', '<Link\n            href="/"')
    content = content.replace('</a>', '</Link>')
    content = content.replace('<a href="/"', '<Link href="/"')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Links fixed.")
