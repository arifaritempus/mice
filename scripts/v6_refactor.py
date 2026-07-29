import re

with open("scripts/v6_form_content.tsx", 'r', encoding='utf-8') as f:
    new_form = f.read()

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start_idx = content.find('<form onSubmit={handleSubmit}')
    end_idx = content.find('</form>', start_idx) + 7
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + new_form + content[end_idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
