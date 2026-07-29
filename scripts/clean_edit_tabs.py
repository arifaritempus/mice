import re
import os

filepath = "frontend/src/app/sejour/[id]/edit/page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

pattern2 = r'          {/\*\s*Main Navigation Tabs\s*\*/}.*?{/\*\s*Tab Content\s*\*/}'
match2 = re.search(pattern2, content, flags=re.DOTALL)
if match2:
    content = content[:match2.start()] + '          {/* Tab Content */}' + content[match2.end():]
    print(f"Successfully removed old tabs in {filepath}")
else:
    print("Could not find old tabs block in edit page.")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
