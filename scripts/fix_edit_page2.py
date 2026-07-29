import re

filepath = "frontend/src/app/sejour/[id]/edit/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "voucherNumber: sejour.voucherNumber || \"\",",
    "voucherNumber: sejour.voucherNumber || \"\",\n              creationDate: sejour.creationDate || \"\",\n              operatorReference: sejour.operatorReference || \"\",\n              enteredBy: sejour.enteredBy || \"\","
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
