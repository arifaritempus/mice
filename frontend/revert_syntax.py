import os

files_to_fix = [
    'src/app/operations/guides/page.tsx',
    'src/app/operations/part-time/page.tsx',
    'src/app/operations/transfers/page.tsx',
    'src/app/projects/view/[id]/page.tsx',
    'src/app/quotes/view/[id]/page.tsx',
    'src/app/tickets/payments/page.tsx',
    'src/app/projects/[id]/AccommodationTab.tsx',
    'src/app/projects/[id]/AccommodationTabOptimized.tsx',
    'src/app/projects/[id]/DigerTab.tsx'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Revert to hardcoded values to fix TS errors in files that don't destructure iconWidth
    content = content.replace('(typeof iconWidth !== "undefined" ? iconWidth : 120)', '120')
    content = content.replace('(typeof iconHeight !== "undefined" ? iconHeight : 60)', '60')
    content = content.replace('(typeof wordmarkWidth !== "undefined" ? wordmarkWidth : 180)', '180')
    content = content.replace('(typeof wordmarkHeight !== "undefined" ? wordmarkHeight : 45)', '45')
    
    content = content.replace('(logos?.iconWidth || 120)', '120')
    content = content.replace('(logos?.iconHeight || 60)', '60')
    content = content.replace('(logos?.wordmarkWidth || 180)', '180')
    content = content.replace('(logos?.wordmarkHeight || 45)', '45')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Reverted in {filepath}")

print("Done reverting broken typescript replacements.")
