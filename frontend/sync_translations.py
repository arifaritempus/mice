import re

filepath = 'src/lib/i18n.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The file has:
# export const translations = {
#   tr: { ... },
#   en: { ... }
# };

# Let's extract tr keys and en keys using regex
tr_match = re.search(r'tr:\s*\{(.*?)\n\s*\},[\s\n]*en:\s*\{', content, re.DOTALL)
if tr_match:
    tr_content = tr_match.group(1)
    # find all keys: 'key.name': 'value',
    tr_keys = re.findall(r"'([^']+)':", tr_content)
    
    en_match = re.search(r'en:\s*\{(.*?)\n\s*\}\n};', content, re.DOTALL)
    if en_match:
        en_content = en_match.group(1)
        en_keys = re.findall(r"'([^']+)':", en_content)
        
        missing_in_en = [k for k in tr_keys if k not in en_keys]
        
        if missing_in_en:
            print(f"Missing in en: {missing_in_en}")
            # Add missing keys to end of en_content
            lines_to_add = []
            for k in missing_in_en:
                # Just add the key with English fallback value (or just the key name)
                # Find the tr value to use as a fallback
                val_match = re.search(rf"'{k}':\s*'([^']*)'", tr_content)
                val = val_match.group(1) if val_match else k
                lines_to_add.append(f"    '{k}': '{val}',")
                
            new_en_content = en_content + "\n" + "\n".join(lines_to_add)
            
            new_full_content = content[:en_match.start(1)] + new_en_content + content[en_match.end(1):]
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_full_content)
            print("Fixed translations.en!")
        else:
            print("No missing keys.")
