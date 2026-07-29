import re

def fix_file(filename):
    with open(filename, "r") as f:
        text = f.read()

    # Remove status check
    text = text.replace(
        '.filter((c) => c.currency === currency && c.status === "completed")',
        '.filter((c) => c.currency === currency)'
    )
    
    with open(filename, "w") as f:
        f.write(text)

fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
fix_file("frontend/src/app/sejour/create/page.tsx")
print("Fixed TS error.")
