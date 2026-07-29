import os
import re

files = ["scripts/apply_foolproof_mockup_v19.py", "scripts/apply_foolproof_mockup_v20.py", "scripts/apply_foolproof_mockup_v24.py", "scripts/apply_foolproof_mockup_v29.py"]

for f in files:
    if not os.path.exists(f): continue
    with open(f, 'r') as file:
        content = file.read()
    
    if 'v19' in f:
        content = content.replace(r'<div className="flex flex-col lg:flex-row gap-2 [^>]+>.*?<option value="GBP">GBP</option>\s*</select>\s*</div>\s*</div>\s*</div>', r'<div className="flex flex-col lg:flex-row gap-2 [^>]+>(?:(?!<div className="flex flex-col lg:flex-row gap-2).)*?<option value="GBP">GBP</option>\s*</select>\s*</div>\s*</div>\s*</div>')
    elif 'v20' in f:
        content = content.replace(r'\{rooms\.map\(\(room, index\) => \(\s*<div\s*key=\{room\.id\}.*?</select>\s*</div>\s*</div>\s*</div>\s*</div>\s*\)\)\}', r'\{rooms\.map\(\(room, index\) => \(\s*<div\s*key=\{room\.id\}(?:(?!\{rooms\.map).)*?</select>\s*</div>\s*</div>\s*</div>\s*</div>\s*\)\)\}')
    elif 'v24' in f:
        content = content.replace(r'\{extraServices\.map\(\(service,\s*index\)\s*=>\s*\(\s*<div[\s\S]*?</div>\s*</div>\s*\)\)\}', r'\{extraServices\.map\(\(service,\s*index\)\s*=>\s*\(\s*<div(?:(?!\{extraServices\.map).)*?</div>\s*</div>\s*\)\)\}')
    elif 'v29' in f:
        pass # v29 looks safe enough if it matches function ComboBox

    with open(f, 'w') as file:
        file.write(content)
    print(f"Fixed {f}")
