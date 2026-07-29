import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

with open("scripts/replace_create_room_grid.py", "r", encoding="utf-8") as f:
    script_content = f.read()

# Extract the new_layout from the script
new_layout_start = script_content.find('new_layout = """') + 16
new_layout_end = script_content.find('"""', new_layout_start)
new_layout = script_content[new_layout_start:new_layout_end]

# Extract the pattern
pattern_match = re.search(r'pattern = r\'(.*?)\'', script_content)
pattern = pattern_match.group(1)

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We use re.DOTALL so .*? matches newlines
    content = re.sub(pattern, new_layout, content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied single-line grid to {filepath}")
