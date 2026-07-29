import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v22(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make the outer container of SearchableSelect stretch fully, and set a default min-height
    old_outer_1 = '      <div className={`relative w-full ${className}`}>'
    new_outer_1 = '      <div className={`relative w-full h-full min-h-[34px] ${className}`}>'
    
    # Make the inner container of SearchableSelect stretch to full height
    old_inner_1 = '<div className="relative flex items-center bg-v3-surface border-2 border-gray-100 dark:border-gray-700/50 rounded-lg transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">'
    new_inner_1 = '<div className="relative flex items-center h-full min-h-[34px] bg-v3-surface border-2 border-gray-100 dark:border-gray-700/50 rounded-lg transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">'
    
    # Alternatively, if it was already modified by v19 but failed, we just target the exact string
    content = content.replace(old_outer_1, new_outer_1)
    content = content.replace(old_inner_1, new_inner_1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY UPDATED SEARCHABLE_SELECT HEIGHT IN {filepath}")

for fp in files:
    apply_v22(fp)
