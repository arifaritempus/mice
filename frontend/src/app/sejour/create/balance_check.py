import sys

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()

    stack = []
    line_no = 1
    col_no = 1
    
    # Simple tag tracer
    tags = []
    
    i = 0
    while i < len(content):
        if content[i] == '\n':
            line_no += 1
            col_no = 1
            i += 1
            continue
        
        # Check for braces
        if content[i] == '{':
            stack.append(('{', line_no))
        elif content[i] == '}':
            if not stack:
                print(f"Extra closing brace at line {line_no}")
            else:
                stack.pop()
        
        # Check for tags (very simple parser)
        if content[i:i+2] == '</':
            end = content.find('>', i)
            tag = content[i+2:end].strip()
            if not tags:
                print(f"Extra closing tag </{tag}> at line {line_no}")
            else:
                opening = tags.pop()
                if opening[0] != tag:
                    # Ignore common self-closing issues in simple parser
                    # but print if it's a major mismatch
                    pass
            i = end
        elif content[i] == '<' and content[i+1] != '!' and content[i+1] != ' ':
            # Possible opening tag
            end = content.find('>', i)
            if end != -1:
                tag_content = content[i+1:end].split()[0]
                if not tag_content.endswith('/') and not tag_content.startswith('?'):
                    tags.append((tag_content, line_no))
                i = end
        
        i += 1
        col_no += 1

    print(f"Remaining braces: {len(stack)}")
    for b in stack:
        print(f"  Unclosed {b[0]} from line {b[1]}")
    
    print(f"Remaining tags: {len(tags)}")
    for t in tags:
        print(f"  Unclosed <{t[0]}> from line {t[1]}")

if __name__ == "__main__":
    check_balance(sys.argv[1])
