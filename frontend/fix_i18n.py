import os

file_path = 'src/lib/i18n.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
tr_seen = set()
en_seen = set()

in_tr = False
in_en = False

for i, line in enumerate(lines):
    line_s = line.strip()
    if 'tr: {' in line:
        in_tr = True
        in_en = False
    elif 'en: {' in line:
        in_tr = False
        in_en = True
    
    if line_s.startswith("'") and ':' in line_s:
        key = line_s.split("':")[0]
        if in_tr:
            if key in tr_seen:
                print(f"Dropping duplicate TR key {key} at line {i+1}")
                continue
            tr_seen.add(key)
        elif in_en:
            if key in en_seen:
                print(f"Dropping duplicate EN key {key} at line {i+1}")
                continue
            en_seen.add(key)
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Done fixing i18n duplicates')
