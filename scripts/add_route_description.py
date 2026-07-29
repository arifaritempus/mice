import re

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "routeDescription?: string;" not in content:
        content = content.replace(
            "direction: \"arrival\" | \"return\" | \"intermediate\";",
            "direction: \"arrival\" | \"return\" | \"intermediate\";\n  routeDescription?: string;"
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
