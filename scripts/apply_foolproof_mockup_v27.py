import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v27(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Narrow Satış Tutarı further and expand Misafir Bilgileri
    # Current values (from v26):
    # Misafir Bilgileri: <div className="flex-[2.1] w-full">
    # Satış Tutarı: <div className="flex-[0.8] w-full">

    pattern_guest = re.compile(r'<div className="flex-\[2\.1\] w-full">(\s*<label[^>]*>\s*Misafir Bilgileri)')
    content = pattern_guest.sub(r'<div className="flex-[2.35] w-full">\1', content)

    pattern_price = re.compile(r'<div className="flex-\[0\.8\] w-full">(\s*<label[^>]*>\s*Satış Tutarı)')
    content = pattern_price.sub(r'<div className="flex-[0.55] w-full">\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY APPLIED V27 ADJUSTMENTS IN {filepath}")

for fp in files:
    apply_v27(fp)
