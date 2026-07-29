import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # General replacements for aggressive typography
    content = content.replace("font-black", "font-semibold")
    content = content.replace("tracking-widest", "tracking-wider")
    content = content.replace("text-[9px]", "text-[10px]") # 9px is too small for corporate

    # Specifically for large headers
    content = content.replace("text-3xl font-semibold", "text-2xl font-bold")
    content = content.replace("text-2xl font-semibold", "text-xl font-bold")
    content = content.replace("text-xl font-semibold", "text-lg font-bold")

    # Replace any leftover bg-v3-surface with standard white
    content = content.replace("bg-v3-surface", "bg-white dark:bg-gray-900")
    content = content.replace("border-v3-border", "border-gray-200 dark:border-gray-700")

    # Fix leftover weird paddings or heights on leftover inputs
    content = re.sub(
        r'className="([^"]*)px-1 py-1 bg-white([^"]*)"',
        r'className="\1px-2 py-1.5 bg-white\2"',
        content
    )
    content = re.sub(
        r'className="([^"]*)text-\[10px\] font-semibold text-v3-text([^"]*)"',
        r'className="\1text-xs font-medium text-gray-900 dark:text-gray-100\2"',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Unified global fonts in {filepath}")

