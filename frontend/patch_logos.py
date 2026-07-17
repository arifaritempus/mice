import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Update the destructuring of getLogosForExcel
    # Match: const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel...
    # (Handling possible newlines or different variable names if they just use logos = await ...)
    content = re.sub(
        r'const\s*{\s*iconLogoBase64\s*,\s*wordmarkLogoBase64\s*}\s*=\s*await getLogosForExcel',
        r'const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel',
        content
    )

    # Sometimes they do: const logos = await getLogosForExcel(...)
    # If so, we just use logos.iconWidth, etc. We'll handle this manually if we find it.

    # 2. Update icon dimensions
    # ext: { width: inchToPx(1.25), height: inchToPx(0.7) }
    content = re.sub(
        r'ext:\s*{\s*width:\s*inchToPx\([^)]+\)\s*,\s*height:\s*inchToPx\([^)]+\)\s*}',
        r'ext: { width: typeof iconWidth !== "undefined" ? iconWidth : 120, height: typeof iconHeight !== "undefined" ? iconHeight : 60 }',
        content
    )

    # 3. Update wordmark dimensions
    # For wordmark there are two variants: inchToPx(2.4) and 180
    # First let's do a specific replacement for the wordmark block
    # We can use a regex that looks for sheet.addImage(markId, ... ext: { ... })
    content = re.sub(
        r'(sheet\.addImage\(markId,\s*{\s*tl:\s*{[^}]+},\s*ext:\s*{)\s*width:\s*[^,]+,\s*height:\s*[^}]+\s*(}(?:\s*as\s*any)?\s*}(?:\s*as\s*any)?\))',
        r'\1 width: typeof wordmarkWidth !== "undefined" ? wordmarkWidth : 180, height: typeof wordmarkHeight !== "undefined" ? wordmarkHeight : 45 \2',
        content
    )
    content = re.sub(
        r'(sheet\.addImage\(wordmarkId,\s*{\s*tl:\s*{[^}]+},\s*ext:\s*{)\s*width:\s*[^,]+,\s*height:\s*[^}]+\s*(}(?:\s*as\s*any)?\s*}(?:\s*as\s*any)?\))',
        r'\1 width: typeof wordmarkWidth !== "undefined" ? wordmarkWidth : 180, height: typeof wordmarkHeight !== "undefined" ? wordmarkHeight : 45 \2',
        content
    )
    
    # Also we need to replace the icon block if it used 120, 60 or something else
    content = re.sub(
        r'(sheet\.addImage\(iconId,\s*{\s*tl:\s*{[^}]+},\s*ext:\s*{)\s*width:\s*[^,]+,\s*height:\s*[^}]+\s*(}(?:\s*as\s*any)?\s*}(?:\s*as\s*any)?\))',
        r'\1 width: typeof iconWidth !== "undefined" ? iconWidth : 120, height: typeof iconHeight !== "undefined" ? iconHeight : 60 \2',
        content
    )

    # If `logos = await getLogosForExcel`
    content = re.sub(
        r'typeof iconWidth !== "undefined" \? iconWidth',
        r'(typeof iconWidth !== "undefined" ? iconWidth : (typeof logos !== "undefined" ? logos.iconWidth : undefined))',
        content
    )
    content = re.sub(
        r'typeof iconHeight !== "undefined" \? iconHeight',
        r'(typeof iconHeight !== "undefined" ? iconHeight : (typeof logos !== "undefined" ? logos.iconHeight : undefined))',
        content
    )
    content = re.sub(
        r'typeof wordmarkWidth !== "undefined" \? wordmarkWidth',
        r'(typeof wordmarkWidth !== "undefined" ? wordmarkWidth : (typeof logos !== "undefined" ? logos.wordmarkWidth : undefined))',
        content
    )
    content = re.sub(
        r'typeof wordmarkHeight !== "undefined" \? wordmarkHeight',
        r'(typeof wordmarkHeight !== "undefined" ? wordmarkHeight : (typeof logos !== "undefined" ? logos.wordmarkHeight : undefined))',
        content
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath}")

# Find all tsx and ts files
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, file))

print("Done patching logos")
