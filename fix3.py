with open('frontend/src/app/quotes/create/page.tsx', 'r') as f:
    lines = f.readlines()
    
# Find the last </div> before `);`
for i in range(len(lines)-1, -1, -1):
    if '</div>' in lines[i]:
        lines[i] = lines[i].replace('</div>', '', 1)
        break

with open('frontend/src/app/quotes/create/page.tsx', 'w') as f:
    f.writelines(lines)
