import re

def fix_file(filename):
    with open(filename, "r") as f:
        text = f.read()
    
    # We want to replace text-3xl with text-xl
    text = text.replace(
        '<h1 className="text-3xl font-bold text-v3-text tracking-tight">',
        '<h1 className="text-xl font-bold text-v3-text tracking-tight">'
    )
    
    with open(filename, "w") as f:
        f.write(text)

fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
fix_file("frontend/src/app/sejour/create/page.tsx")
