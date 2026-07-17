with open('frontend/src/components/TopNavigation.tsx', 'r') as f:
    content = f.read()

# Replace first (Eye)
content = content.replace(
    'group-hover:w-[350px]',
    'group-hover:max-w-[500px]'
)
# Replace second (Plus)
content = content.replace(
    'group-hover:w-[230px]',
    'group-hover:max-w-[500px]'
)
# Replace third (Edit)
content = content.replace(
    'group-hover:w-[450px]',
    'group-hover:max-w-[500px]'
)

# And replace w-0 with max-w-0 in all three
content = content.replace(
    'opacity-0 w-0 overflow-hidden',
    'opacity-0 max-w-0 overflow-hidden'
)

with open('frontend/src/components/TopNavigation.tsx', 'w') as f:
    f.write(content)
