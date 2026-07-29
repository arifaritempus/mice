import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v25(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to change the flex values for the Rooms row:
    # 1. C-In / C-Out: <div className="flex-[2] w-full">\s*<label[^>]*>\s*C-In / C-Out
    # 2. Misafir Bilgileri: <div className="flex-\[1.2\] w-full">\s*<label[^>]*>\s*Misafir Bilgileri
    # 3. Satış Tutarı: <div className="flex-\[1.2\] w-full">\s*<label[^>]*>\s*Satış Tutarı

    pattern_dates = re.compile(r'<div className="flex-\[2\] w-full">(\s*<label[^>]*>\s*C-In / C-Out)')
    content = pattern_dates.sub(r'<div className="flex-[1.5] w-full">\1', content)

    pattern_guest = re.compile(r'<div className="flex-\[1\.2\] w-full">(\s*<label[^>]*>\s*Misafir Bilgileri)')
    content = pattern_guest.sub(r'<div className="flex-[1.9] w-full">\1', content)

    pattern_price = re.compile(r'<div className="flex-\[1\.2\] w-full">(\s*<label[^>]*>\s*Satış Tutarı)')
    content = pattern_price.sub(r'<div className="flex-[1] w-full">\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY ADJUSTED FLEX WIDTHS IN {filepath}")

for fp in files:
    apply_v25(fp)
