import sys

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    diff = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        opens = line.count('<div')
        closes = line.count('</div')
        diff += opens - closes
    
    print(f"File: {filename}")
    print(f"Final Div Balance: {diff}")

    # Check curly braces
    braces = 0
    for i, line in enumerate(lines):
        opens = line.count('{')
        closes = line.count('}')
        braces += opens - closes
    print(f"Final Brace Balance: {braces}")

    # Check parens
    parens = 0
    for i, line in enumerate(lines):
        opens = line.count(')')
        closes = line.count('(') # wait, I wrote parens += opens - closes earlier, but here I'm checking balance.
        # correct logic: opens - closes
    
    # Let's fix the paren logic in the script.
    parens = 0
    for line in lines:
        parens += line.count('(') - line.count(')')
    print(f"Final Paren Balance: {parens}")

if len(sys.argv) > 1:
    check_balance(sys.argv[1])
else:
    print("Please provide a filename")

