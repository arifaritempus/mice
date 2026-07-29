import re

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the block I just injected at the top because it's duplicated
    content = re.sub(
        r'const \[isEditingInfo, setIsEditingInfo\] = useState\(false\);\n.*?const formatAmount = \(val: number\) => \{.*?\}\s*;\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Wait, if I remove the block I injected, `isEditingInfo`, `setExpandedSection`, `parseAmount` might be deleted if they weren't in the file already!
    # Let's just remove the original ones deeper in the file or just do string replacement
