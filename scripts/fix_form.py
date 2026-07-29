import re
import os

with open("scripts/new_form_content_create.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# Fix totals/costs function calls
content = content.replace("totals.USD", "getTotalForCurrency(\"USD\")")
content = content.replace("costs.USD", "getCostForCurrency(\"USD\")")
# Also fix the math for Profit:
content = content.replace("(totals.USD - costs.USD)", "(getTotalForCurrency(\"USD\") - getCostForCurrency(\"USD\"))")

with open("scripts/new_form_content_create.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

# Now fix create/page.tsx salesData initial state
filepath = "frontend/src/app/sejour/create/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    page_content = f.read()

if "creationDate: new Date" not in page_content:
    page_content = page_content.replace(
        "voucherNumber: \"\",",
        "voucherNumber: \"\",\n    creationDate: new Date().toISOString().split('T')[0],\n    operatorReference: \"\",\n    enteredBy: \"\","
    )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(page_content)

print("Fixed variables.")
