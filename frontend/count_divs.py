import re
with open('src/app/reports/page.tsx', 'r') as f:
    text = f.read()

return_idx = text.find('return (')
if return_idx == -1:
    print("No return found")
    exit(1)

jsx_text = text[return_idx:]

open_divs = len(re.findall(r'<div', jsx_text))
close_divs = len(re.findall(r'</div', jsx_text))

print(f"Open divs: {open_divs}")
print(f"Close divs: {close_divs}")

# Let's count all tags!
tags = re.findall(r'</?([a-zA-Z0-9_]+)[^>]*>', jsx_text)
stack = []
for tag in tags:
    if not tag.startswith('/') and not tag.endswith('/'):
        # opening
        if not jsx_text.split('<'+tag, 1)[1].split('>', 1)[0].endswith('/'):
            # It's an opening tag unless it's self closing like <input ... />
            pass
