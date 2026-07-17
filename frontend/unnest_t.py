import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We will use regex to find nested `(t('something') || (t('something') || ...))`
    # Pattern: \(t\('[^']+'\)\s*\|\|\s*\(t\('[^']+'\)\s*\|\|\s*([^)]+)\)\)
    # We will repeat this until no more changes happen.
    
    changed = True
    while changed:
        old_content = content
        
        # Un-nest single quotes
        content = re.sub(
            r"\(t\('([^']+)'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*('[^']+')\)\)",
            r"(t('\1') || \2)",
            content
        )
        # Un-nest double quotes
        content = re.sub(
            r"\(t\('([^']+)'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*(\"[^\"]+\")\)\)",
            r"(t('\1') || \2)",
            content
        )
        # Unnest 3 levels where the first one has double quotes
        content = re.sub(
            r"t\('([^']+)'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*('[^']+')\)\)",
            r"(t('\1') || \2)",
            content
        )
        content = re.sub(
            r"t\('([^']+)'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*(\"[^\"]+\")\)\)",
            r"(t('\1') || \2)",
            content
        )
        # Also fix t('key') || (t('key') || 'text')
        content = re.sub(
            r"t\('([^']+)'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*('[^']+')\)",
            r"(t('\1') || \2)",
            content
        )
        content = re.sub(
            r"t\('([^']+)'\)\s*\|\|\s*\(t\('\1'\)\s*\|\|\s*(\"[^\"]+\")\)",
            r"(t('\1') || \2)",
            content
        )
        
        if content == old_content:
            changed = False

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/app/projects/[id]/page.tsx')
process_file('src/app/projects/[id]/TransferTurTab.tsx')

print("Un-nested t() calls")
