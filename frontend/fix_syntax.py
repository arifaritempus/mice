import os

def fix_syntax(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Fix iconWidth syntax error
    content = content.replace(
        '(typeof iconWidth !== "undefined" ? iconWidth : (typeof logos !== "undefined" ? logos.iconWidth : undefined)) : 120',
        '(typeof iconWidth !== "undefined" ? iconWidth : (typeof logos !== "undefined" ? logos.iconWidth : 120))'
    )
    content = content.replace(
        '(typeof iconWidth !== "undefined" ? iconWidth : (typeof logos !== "undefined" ? logos.iconWidth : undefined)) : undefined',
        '(typeof iconWidth !== "undefined" ? iconWidth : (typeof logos !== "undefined" ? logos.iconWidth : 120))'
    )

    # Fix iconHeight syntax error
    content = content.replace(
        '(typeof iconHeight !== "undefined" ? iconHeight : (typeof logos !== "undefined" ? logos.iconHeight : undefined)) : 60',
        '(typeof iconHeight !== "undefined" ? iconHeight : (typeof logos !== "undefined" ? logos.iconHeight : 60))'
    )
    content = content.replace(
        '(typeof iconHeight !== "undefined" ? iconHeight : (typeof logos !== "undefined" ? logos.iconHeight : undefined)) : undefined',
        '(typeof iconHeight !== "undefined" ? iconHeight : (typeof logos !== "undefined" ? logos.iconHeight : 60))'
    )

    # Fix wordmarkWidth syntax error
    content = content.replace(
        '(typeof wordmarkWidth !== "undefined" ? wordmarkWidth : (typeof logos !== "undefined" ? logos.wordmarkWidth : undefined)) : 180',
        '(typeof wordmarkWidth !== "undefined" ? wordmarkWidth : (typeof logos !== "undefined" ? logos.wordmarkWidth : 180))'
    )
    content = content.replace(
        '(typeof wordmarkWidth !== "undefined" ? wordmarkWidth : (typeof logos !== "undefined" ? logos.wordmarkWidth : undefined)) : undefined',
        '(typeof wordmarkWidth !== "undefined" ? wordmarkWidth : (typeof logos !== "undefined" ? logos.wordmarkWidth : 180))'
    )

    # Fix wordmarkHeight syntax error
    content = content.replace(
        '(typeof wordmarkHeight !== "undefined" ? wordmarkHeight : (typeof logos !== "undefined" ? logos.wordmarkHeight : undefined)) : 45',
        '(typeof wordmarkHeight !== "undefined" ? wordmarkHeight : (typeof logos !== "undefined" ? logos.wordmarkHeight : 45))'
    )
    content = content.replace(
        '(typeof wordmarkHeight !== "undefined" ? wordmarkHeight : (typeof logos !== "undefined" ? logos.wordmarkHeight : undefined)) : undefined',
        '(typeof wordmarkHeight !== "undefined" ? wordmarkHeight : (typeof logos !== "undefined" ? logos.wordmarkHeight : 45))'
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            fix_syntax(os.path.join(root, file))

print("Done")
