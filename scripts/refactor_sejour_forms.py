import re
import os

files_to_process = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx",
    "frontend/src/app/sejour/[id]/page.tsx"
]

LABEL_CLASS = 'block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5'
INPUT_CLASS = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-bold text-v3-text'
CARD_CLASS = 'bg-v3-surface rounded-xl p-4 border border-v3-border shadow-sm'

def refactor_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Labels
    content = re.sub(
        r'<label\s+className="[^"]*"',
        f'<label className="{LABEL_CLASS}"',
        content
    )
    
    # Also update label without className
    content = re.sub(
        r'<label>',
        f'<label className="{LABEL_CLASS}">',
        content
    )

    # 2. Update Input elements (basic ones)
    content = re.sub(
        r'<input([^>]+)className="(?:[^"]*w-full[^"]*|[^"]*border[^"]*|[^"]*p-[23][^"]*)"',
        f'<input\\1className="{INPUT_CLASS}"',
        content
    )

    # 3. Update Select elements
    content = re.sub(
        r'<select([^>]+)className="(?:[^"]*w-full[^"]*|[^"]*border[^"]*|[^"]*p-[23][^"]*)"',
        f'<select\\1className="{INPUT_CLASS}"',
        content
    )
    
    # 4. Update large paddings to p-4 (for cards)
    content = content.replace('p-6', 'p-4')
    content = content.replace('p-8', 'p-4')
    content = content.replace('gap-6', 'gap-4')
    content = content.replace('gap-8', 'gap-4')

    # 5. Background replacements
    content = content.replace('bg-white dark:bg-gray-800', 'bg-v3-surface')
    content = content.replace('border-gray-200 dark:border-gray-700', 'border-v3-border')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Refactored {filepath}")

for fp in files_to_process:
    refactor_file(fp)
