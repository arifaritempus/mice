import re

filepath = "frontend/src/app/sejour/[id]/edit/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "creationDate: sejour.creationDate || \"\",\n              operatorReference: sejour.operatorReference || \"\",\n              enteredBy: sejour.enteredBy || \"\",",
    "creationDate: (sejour as any).creationDate || \"\",\n              operatorReference: (sejour as any).operatorReference || \"\",\n              enteredBy: (sejour as any).enteredBy || \"\","
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
