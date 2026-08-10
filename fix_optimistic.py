import re

def fix_file(filepath, var_name, entity_name):
    with open(filepath, 'r') as f:
        content = f.read()

    pattern = r'(\.\.\.' + entity_name + r',\n\s*)(name: nameValue,)'
    content = re.sub(pattern, r'\1bank_accounts: bankAccounts,\n                \2', content)

    with open(filepath, 'w') as f:
        f.write(content)
        print(f"Patched {filepath}")

fix_file("frontend/src/app/hotels/page.tsx", "updatedHotels", "hotel")
fix_file("frontend/src/app/suppliers/page.tsx", "updatedSuppliers", "supplier")
