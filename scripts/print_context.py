import os

filepath = "frontend/src/app/sejour/create/page.tsx"
with open(filepath, 'r') as f:
    content = f.read()

idx = content.find('{/* Accommodation Section */}')
if idx != -1:
    print(content[idx-200:idx+300])
