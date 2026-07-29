import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We need to insert </div> before {showFlight && (
    # But ONLY if it hasn't been inserted already
    if '</div>\n                {showFlight && (' not in content:
        content = content.replace('{showFlight && (', '</div>\n                {showFlight && (')
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

