import sys

def check_structure_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()

    stack = []
    line_no = 1
    
    # Track braces, parens, and generic tags
    i = 0
    while i < len(content):
        c = content[i]
        if c == '\n':
            line_no += 1
        
        if c == '{':
            stack.append(('{', line_no))
        elif c == '(':
            stack.append(('(', line_no))
        elif c == '[':
            stack.append(('[', line_no))
        elif c == '}':
            if not stack or stack[-1][0] != '{':
                print(f"Mismatch: found }} at line {line_no} but expected {stack[-1][0] if stack else 'nothing'}")
                if stack: stack.pop()
            else:
                stack.pop()
        elif c == ')':
            if not stack or stack[-1][0] != '(':
                print(f"Mismatch: found ) at line {line_no} but expected {stack[-1][0] if stack else 'nothing'}")
                if stack: stack.pop()
            else:
                stack.pop()
        elif c == ']':
            if not stack or stack[-1][0] != '[':
                print(f"Mismatch: found ] at line {line_no} but expected {stack[-1][0] if stack else 'nothing'}")
                if stack: stack.pop()
            else:
                stack.pop()
        i += 1

    if not stack:
        print("All braces, parens, and brackets are balanced!")
    else:
        print(f"Remaining in stack: {len(stack)}")
        for item in stack:
            print(f"  Unclosed {item[0]} from line {item[1]}")

if __name__ == "__main__":
    check_structure_balance(sys.argv[1])
