import os
import re

def fix_ts_errors(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    content = re.sub(
        r'\(typeof iconWidth !== "undefined" \? iconWidth : \(typeof logos !== "undefined" \? logos\.iconWidth : (\d+)\)\)',
        r'(typeof iconWidth !== "undefined" ? iconWidth : \1)',
        content
    )
    content = re.sub(
        r'\(typeof iconHeight !== "undefined" \? iconHeight : \(typeof logos !== "undefined" \? logos\.iconHeight : (\d+)\)\)',
        r'(typeof iconHeight !== "undefined" ? iconHeight : \1)',
        content
    )
    content = re.sub(
        r'\(typeof wordmarkWidth !== "undefined" \? wordmarkWidth : \(typeof logos !== "undefined" \? logos\.wordmarkWidth : (\d+)\)\)',
        r'(typeof wordmarkWidth !== "undefined" ? wordmarkWidth : \1)',
        content
    )
    content = re.sub(
        r'\(typeof wordmarkHeight !== "undefined" \? wordmarkHeight : \(typeof logos !== "undefined" \? logos\.wordmarkHeight : (\d+)\)\)',
        r'(typeof wordmarkHeight !== "undefined" ? wordmarkHeight : \1)',
        content
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            fix_ts_errors(os.path.join(root, file))

print("Done")
