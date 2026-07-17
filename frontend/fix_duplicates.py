import os
import re

files_to_fix = [
    'src/app/quotes/view/[id]/page.tsx',
    'src/app/projects/view/[id]/page.tsx'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the duplicate declarations and remove the one with `logos?.`
    content = re.sub(r'\s*const iconWidth = logos\?\.iconWidth \|\| 120;.*?(?=const inchToPx =)', '', content, flags=re.DOTALL)
    
    # Also I noticed that `wordmarkLogoBase64` falls back to `logosData.wordmarkLogoBase64` but `iconLogoBase64` falls back to `logosData.iconLogoBase64`.
    # And there was another fallback. Let's make sure it looks clean.
    # The variable should just be:
    # const iconWidth = logosData.iconWidth || 60;
    # const iconHeight = logosData.iconHeight || 60;
    # const wordmarkWidth = logosData.wordmarkWidth || 120;
    # const wordmarkHeight = logosData.wordmarkHeight || 60;
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath}")

print("Done removing duplicates.")
