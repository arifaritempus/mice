import re

# We will apply a unified wrapper for the search bar to ensure they all render identically.
# The user wants "hepsi aynı olsun", which means they all need identical outer constraints.

def fix_accommodation(content):
    # Accommodation has:
    # <div className="flex flex-col md:flex-row md:items-center gap-4">
    #   <div className="w-full md:flex-1 min-w-0">
    #      <div className="flex-1 flex flex-wrap ..."> ... </div>
    #   </div>
    # </div>
    # We will just change the wrapper to `<div className="w-full mb-4">`
    pattern = r'<div className="flex flex-col md:flex-row md:items-center gap-4">\s*\{\/\* Arama Barı \*\/\}\s*<div className="w-full md:flex-1 min-w-0">\s*<div className="flex-1 flex flex-wrap items-center gap-1\.5 px-3 py-1\.5 bg-white dark:bg-\[\#1e293b\]/80 border border-gray-300 dark:border-gray-700 rounded-lg min-h-\[40px\] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">(.*?)</div>\s*</div>\s*\{\/\* Buton Grupları \*\/\}\s*</div>'
    
    def repl(m):
        inner = m.group(1)
        return f'<div className="w-full mb-4"><div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e293b]/80 border border-gray-300 dark:border-slate-700/50 rounded-lg min-h-[40px] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">{inner}</div></div>'
    
    return re.sub(pattern, repl, content, flags=re.DOTALL)

def fix_transfer(content):
    # Transfer has:
    # <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 mb-2 bg-gray-100 dark:bg-[#0f172a]/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-3 shadow-sm shrink-0">
    #   <div className="flex-1 mr-4">
    #      <div className="flex-1 flex flex-wrap ..."> ... </div>
    #   </div>
    # </div>
    pattern = r'<div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 mb-2 bg-gray-100 dark:bg-\[\#0f172a\]/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-3 shadow-sm shrink-0">\s*<div className="flex-1 mr-4">\s*<div className="flex-1 flex flex-wrap items-center gap-1\.5 px-3 py-1\.5 bg-white dark:bg-\[\#1e293b\]/80 border border-gray-300 dark:border-gray-700 rounded-lg min-h-\[40px\] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">(.*?)</div>\s*</div>\s*</div>'
    
    def repl(m):
        inner = m.group(1)
        return f'<div className="w-full mb-4"><div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e293b]/80 border border-gray-300 dark:border-slate-700/50 rounded-lg min-h-[40px] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">{inner}</div></div>'
        
    return re.sub(pattern, repl, content, flags=re.DOTALL)

def fix_ucak(content):
    # UcakBileti has:
    # <div className="flex-1 flex flex-wrap ..."> ... </div>
    # Just needs dark:border-slate-700/50 instead of dark:border-gray-700
    # And wrapped in <div className="mb-4">
    pattern = r'<div className="flex-1 flex flex-wrap items-center gap-1\.5 px-3 py-1\.5 bg-white dark:bg-\[\#1e293b\]/80 border border-gray-300 dark:border-gray-700 rounded-lg min-h-\[40px\] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">(.*?)</div>'
    
    def repl(m):
        inner = m.group(1)
        return f'<div className="w-full mb-4"><div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e293b]/80 border border-gray-300 dark:border-slate-700/50 rounded-lg min-h-[40px] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">{inner}</div></div>'
        
    return re.sub(pattern, repl, content, flags=re.DOTALL)

def fix_diger(content):
    # DigerTab has:
    # <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50 mb-4">
    #   <div className="flex items-center gap-2">...</div>
    #   <div className="w-2/3 md:w-1/2">
    #      <div className="flex-1 flex flex-wrap ..."> ... </div>
    #   </div>
    # </div>
    # We completely strip the outer gray-800 box and title to make it identical!
    pattern = r'<div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50 mb-4">.*?<div className="flex-1 flex flex-wrap items-center gap-1\.5 px-3 py-1\.5 bg-white dark:bg-\[\#1e293b\]/80 border border-gray-300 dark:border-gray-700 rounded-lg min-h-\[40px\] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">(.*?)</div>\s*</div>\s*</div>'
    
    def repl(m):
        inner = m.group(1)
        return f'<div className="w-full mb-4"><div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e293b]/80 border border-gray-300 dark:border-slate-700/50 rounded-lg min-h-[40px] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">{inner}</div></div>'
        
    return re.sub(pattern, repl, content, flags=re.DOTALL)


# Apply fixes
files = [
    ('src/app/projects/[id]/AccommodationTabOptimized.tsx', fix_accommodation),
    ('src/app/projects/[id]/TransferTurTab.tsx', fix_transfer),
    ('src/app/projects/[id]/UcakBiletiTab.tsx', fix_ucak),
    ('src/app/projects/[id]/DigerTab.tsx', fix_diger)
]

for filepath, fixer in files:
    with open(filepath, 'r') as f:
        content = f.read()
    new_content = fixer(content)
    with open(filepath, 'w') as f:
        f.write(new_content)

print("Wrappers standardized.")
