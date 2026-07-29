import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Ensure `)}` for activeTab === "sales" is deleted.
    # It looks like:
    #             )}
    #
    #                   </div>
    #                 </div> {/* END OF HIZMETLER */}
    content = re.sub(r'\}\s*\)\}\s*<\/div>\s*<\/div>\s*\{\/\*\s*END OF HIZMETLER\s*\*\/\}', '}\n                  </div>\n                </div> {/* END OF HIZMETLER */}', content)
    
    # Also if there's a stray )} before END OF HIZMETLER
    content = re.sub(r'\s*\)\}\s*<\/div>\s*<\/div>\s*\{\/\*\s*END OF HIZMETLER\s*\*\/\}', '\n                  </div>\n                </div> {/* END OF HIZMETLER */}', content)

    # 2. Add the closing `)}` and `</>` at the end of the file
    if ")}</>" not in content and ")}\n    </>" not in content:
        content = re.sub(r'(\s*<\/div>\s*<\/div>\s*\);\s*\})', r'\n      )}\n    </>\1', content)
        
    with open(filepath, 'w') as f:
        f.write(content)

fix_file("frontend/src/app/sejour/create/page.tsx")
fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
