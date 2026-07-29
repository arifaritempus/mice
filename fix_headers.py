import re

def fix_file(filename):
    with open(filename, "r") as f:
        text = f.read()
    
    # We want to replace font-black with font-bold for the specific headers
    # Look for: <h1 className="text-3xl font-black text-v3-text tracking-tight">
    text = text.replace(
        '<h1 className="text-3xl font-black text-v3-text tracking-tight">',
        '<h1 className="text-3xl font-bold text-v3-text tracking-tight">'
    )
    
    # Look for: <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-widest">
    text = text.replace(
        '<p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-widest">',
        '<p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-widest">'
    )
    
    with open(filename, "w") as f:
        f.write(text)

fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
fix_file("frontend/src/app/sejour/create/page.tsx")
