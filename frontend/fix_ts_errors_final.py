import os
import re

def fix_ts_errors_final(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    has_destructured = 'iconWidth' in content and '{' in content and 'iconWidth' in content.split('{')[1].split('}')[0] if '{' in content and '}' in content else False
    # A better heuristic: if "logos.iconWidth" exists or "const logos =" exists, and no "{ iconWidth" exists
    if "const logos = " in content or "let logos = " in content:
        content = re.sub(r'\(typeof iconWidth !== "undefined" \? iconWidth : (\d+)\)', r'(logos?.iconWidth || \1)', content)
        content = re.sub(r'\(typeof iconHeight !== "undefined" \? iconHeight : (\d+)\)', r'(logos?.iconHeight || \1)', content)
        content = re.sub(r'\(typeof wordmarkWidth !== "undefined" \? wordmarkWidth : (\d+)\)', r'(logos?.wordmarkWidth || \1)', content)
        content = re.sub(r'\(typeof wordmarkHeight !== "undefined" \? wordmarkHeight : (\d+)\)', r'(logos?.wordmarkHeight || \1)', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            fix_ts_errors_final(os.path.join(root, file))

print("Done")
