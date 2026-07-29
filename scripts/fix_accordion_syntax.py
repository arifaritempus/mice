import re
import os

def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove `{activeTab === "sales" && (`
    content = content.replace('{activeTab === "sales" && (', '')

    # 2. Remove the EXACT `)}` that matches it.
    # It looks like this:
    #             )}
    #
    #             </div>
    #                 {/* Purchase Tab */}
    #             {activeTab === "purchase" && (
    
    content = re.sub(r'\}\s*\)\}\s*<\/div>\s*\{\/\*\s*Purchase Tab\s*\*\/\}', '}\n            </div>\n                {/* Purchase Tab */}', content)
    
    # Or in edit/page.tsx:
    content = re.sub(r'\}\s*\)\}\s*<\/div>\s*\{\/\*\s*Purchase Tab\s*\*\/\}', '}\n            </div>\n                {/* Purchase Tab */}', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed syntax for {filepath}")

fix_file("frontend/src/app/sejour/create/page.tsx")
fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
