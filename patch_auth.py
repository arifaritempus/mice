with open('frontend/src/components/AuthWrapper.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="flex h-screen transition-colors duration-200"',
    'className="flex flex-col md:flex-row h-screen transition-colors duration-200"'
)

with open('frontend/src/components/AuthWrapper.tsx', 'w') as f:
    f.write(content)
print("Patched AuthWrapper.tsx successfully")
