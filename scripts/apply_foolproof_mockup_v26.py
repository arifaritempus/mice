import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v26(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update font size for date inputs inside C-In / C-Out row
    # The old class is: "w-full h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
    date_input_old = 'className="w-full h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"'
    date_input_new = 'className="w-full h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[11px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"'
    content = content.replace(date_input_old, date_input_new)

    # 2. Update flex widths for C-In / C-Out, Misafir Bilgileri, Satış Tutarı
    pattern_dates = re.compile(r'<div className="flex-\[1\.5\] w-full">(\s*<label[^>]*>\s*C-In / C-Out)')
    content = pattern_dates.sub(r'<div className="flex-[1.6] w-full">\1', content)

    pattern_guest = re.compile(r'<div className="flex-\[1\.9\] w-full">(\s*<label[^>]*>\s*Misafir Bilgileri)')
    content = pattern_guest.sub(r'<div className="flex-[2.1] w-full">\1', content)

    pattern_price = re.compile(r'<div className="flex-\[1\] w-full">(\s*<label[^>]*>\s*Satış Tutarı)')
    content = pattern_price.sub(r'<div className="flex-[0.8] w-full">\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY APPLIED V26 ADJUSTMENTS IN {filepath}")

for fp in files:
    apply_v26(fp)
