import os
import re

files = [
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v28(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Target addRoom in edit page
    pattern = re.compile(r'(costCurrency:\s*"TRY",\s*\n)(\s*\};\s*\n\s*setRooms\(\[\.\.\.rooms,\s*newRoom\]\);)')
    
    def repl(m):
        return m.group(1) + '      checkInDate: salesData.checkInDate || "",\n      checkOutDate: salesData.checkOutDate || "",\n' + m.group(2)

    content = pattern.sub(repl, content)

    # Let's also check if addExtraService missed the date injection in edit page because of a different format?
    # In v24.py I did: description: "", \n };
    # Let's verify addExtraService in edit/page.tsx just in case
    # If not present, we can force it too.
    if 'date: salesData.checkInDate || ""' not in content[content.find('const addExtraService'):]:
        extra_pattern = re.compile(r'(const newService:\s*ExtraService\s*=\s*\{[\s\S]*?description:\s*"",\s*\n)(\s*\};)')
        def extra_repl(m):
            return m.group(1) + '      date: salesData.checkInDate || "",\n' + m.group(2)
        content = extra_pattern.sub(extra_repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY APPLIED V28 DEFAULT DATES IN {filepath}")

for fp in files:
    apply_v28(fp)
