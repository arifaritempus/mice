import re

files = [
    "frontend/src/app/quotes/create/page.tsx",
    "frontend/src/app/quotes/[id]/edit/page.tsx",
    "frontend/src/app/quotes/[id]/page.tsx"
]

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()

    # Update the container for the hotel tabs
    content = content.replace(
        'className="flex bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 space-x-2 overflow-x-auto"',
        'className="flex md:justify-center bg-gray-50 dark:bg-[#0f172a]/70 dark:backdrop-blur-md p-1.5 rounded-xl border border-gray-100 dark:border-gray-700/50 space-x-2 overflow-x-auto shadow-sm"'
    )

    # Update active and inactive tab styles for selectedHotels (TÜMÜ tab isn't here yet, but the individual hotels are)
    content = content.replace(
        'bg-blue-500 text-white shadow-md shadow-blue-500/20',
        'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
    )
    content = content.replace(
        'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        'bg-[#1e293b]/50 text-gray-400 hover:text-white hover:bg-[#1e293b]'
    )
    content = content.replace(
        'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
        'bg-indigo-600/90 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
    )
    
    # Text colors
    content = content.replace(
        'className="text-xs font-semibold mr-2"',
        'className="text-[10px] font-black uppercase tracking-tight mr-2"'
    )
    content = content.replace(
        'className="text-xs font-semibold"',
        'className="text-[10px] font-black uppercase tracking-tight"'
    )

    with open(filepath, "w") as f:
        f.write(content)

print("Quotes outer tabs refactored!")
