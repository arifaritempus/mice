import re

# Update CommandCenter.tsx
with open("frontend/src/components/CommandCenter.tsx", "r") as f:
    text = f.read()

pattern = r'(\{\s*label:\s*"Teklifler",\s*href:\s*"/quotes",\s*icon:\s*<FileText\s*size=\{16\}\s*\/>\s*\},)'
replacement = r'\1\n        { label: "Talepler", href: "/requests", icon: <FileText size={16} /> },'
text = re.sub(pattern, replacement, text)

with open("frontend/src/components/CommandCenter.tsx", "w") as f:
    f.write(text)

# Check TopNavigation.tsx
with open("frontend/src/components/TopNavigation.tsx", "r") as f:
    top_text = f.read()

if '{ title: "Teklifler"' in top_text and '{ title: "Talepler"' not in top_text:
    top_pattern = r'(\{\s*title:\s*"Teklifler",\s*href:\s*"/quotes",\s*keywords:\s*"mice teklif"\s*\},)'
    top_replacement = r'\1\n  { title: "Talepler", href: "/requests", keywords: "mice talep" },'
    top_text = re.sub(top_pattern, top_replacement, top_text)
    with open("frontend/src/components/TopNavigation.tsx", "w") as f:
        f.write(top_text)

print("Menus updated.")
