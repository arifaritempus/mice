import re
import os

with open("scripts/v5_form_content.tsx", 'r', encoding='utf-8') as f:
    new_form = f.read()

# REFACTOR CREATE PAGE
create_path = "frontend/src/app/sejour/create/page.tsx"
with open(create_path, 'r', encoding='utf-8') as f:
    create_content = f.read()

# Replace the form
start_idx = create_content.find('<form onSubmit={handleSubmit}')
end_idx = create_content.find('</form>', start_idx) + 7
if start_idx != -1 and end_idx != -1:
    create_content = create_content[:start_idx] + new_form + create_content[end_idx:]

# Fix salesData initial state
create_content = re.sub(
    r'creationDate: "",\s*operatorReference: "",\s*enteredBy: "",\s*',
    '',
    create_content
)

# Remove unused activeInnerTabs state if it exists
create_content = re.sub(
    r'const \[activeInnerTabs, setActiveInnerTabs\] = useState<Record<string, string>>\(\{.*?\}\);\n\s*',
    '',
    create_content
)

with open(create_path, 'w', encoding='utf-8') as f:
    f.write(create_content)
print("Updated create/page.tsx")


# REFACTOR EDIT PAGE
edit_path = "frontend/src/app/sejour/[id]/edit/page.tsx"
with open(edit_path, 'r', encoding='utf-8') as f:
    edit_content = f.read()

# Replace the form
start_idx = edit_content.find('<form onSubmit={handleSubmit}')
end_idx = edit_content.find('</form>', start_idx) + 7
if start_idx != -1 and end_idx != -1:
    edit_content = edit_content[:start_idx] + new_form + edit_content[end_idx:]

# Fix salesData initial state
edit_content = re.sub(
    r'creationDate: "",\s*operatorReference: "",\s*enteredBy: "",\s*',
    '',
    edit_content
)

# Fix setSalesData in useEffect
edit_content = re.sub(
    r'creationDate: \(sejour as any\)\.creationDate \|\| "",\s*operatorReference: \(sejour as any\)\.operatorReference \|\| "",\s*enteredBy: \(sejour as any\)\.enteredBy \|\| "",\s*',
    '',
    edit_content
)

# Remove unused activeInnerTabs state if it exists
edit_content = re.sub(
    r'const \[activeInnerTabs, setActiveInnerTabs\] = useState<Record<string, string>>\(\{.*?\}\);\n\s*',
    '',
    edit_content
)

with open(edit_path, 'w', encoding='utf-8') as f:
    f.write(edit_content)
print("Updated edit/page.tsx")

