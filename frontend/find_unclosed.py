import re

content = open('src/app/dashboard/page.tsx').read()
stack = []
for m in re.finditer(r'<(/?)(div)\b[^>]*?(/?)\s*>', content):
    tag_str = m.group(0)
    is_close = m.group(1) == '/'
    is_self_close = m.group(3) == '/'
    
    if is_self_close:
        continue
        
    line_no = content[:m.start()].count('\n') + 1
    
    if is_close:
        if stack:
            stack.pop()
        else:
            print(f"Extra closing tag at line {line_no}")
    else:
        stack.append(line_no)

for s in stack:
    print(f"Unclosed open tag at line {s}")
