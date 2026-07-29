import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

input_standard = "w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
label_standard = "block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5"
price_input_standard = "flex-1 h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
currency_select_standard = "w-[65px] h-[36px] px-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ml-1"

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the accordion area starting from "{/* Hizmetler Header */}"
    start_tag = '{/* Hizmetler Header */}'
    parts = content.split(start_tag, 1)
    if len(parts) == 2:
        top_part = parts[0]
        bottom_part = parts[1]
        
        # 1. Normalize all Labels in the bottom part
        bottom_part = re.sub(
            r'<label\s+className="block[^"]+uppercase[^"]+">',
            f'<label className="{label_standard}">',
            bottom_part
        )
        bottom_part = re.sub(
            r'<label\s+className="block\s+text-\[\d+px\]\s+font-[^\s]+\s+text-[^\s]+\s+mb-[^"]+">',
            f'<label className="{label_standard}">',
            bottom_part
        )
        
        # 2. Normalize Standard Inputs and Selects
        # We target inputs and selects that have `bg-v3-surface` or `px-2 py-1` or `h-[32px]`
        bottom_part = re.sub(
            r'<input\s+className="w-full[^"]+bg-v3-surface[^"]+"',
            f'<input className="{input_standard}"',
            bottom_part
        )
        bottom_part = re.sub(
            r'<input\s+type="date"\s+className="w-full[^"]+bg-v3-surface[^"]+"',
            f'<input type="date" className="{input_standard}"',
            bottom_part
        )
        bottom_part = re.sub(
            r'<input\s+type="time"\s+className="w-full[^"]+bg-v3-surface[^"]+"',
            f'<input type="time" className="{input_standard}"',
            bottom_part
        )
        bottom_part = re.sub(
            r'<select\s+className="w-full[^"]+bg-v3-surface[^"]+"',
            f'<select className="{input_standard}"',
            bottom_part
        )
        
        # For the flight/transfer standard inputs that don't say w-full specifically in regex
        bottom_part = re.sub(
            r'className="w-full[^"]+border-v3-border[^"]+"',
            f'className="{input_standard}"',
            bottom_part
        )

        # 3. Normalize Price Inputs (they start with flex-1 and have text-right or specific colors)
        bottom_part = re.sub(
            r'<input\s+className="flex-1[^"]+text-\w+-600[^"]+"',
            f'<input className="{price_input_standard}"',
            bottom_part
        )
        
        # 4. Normalize Currency Selects (w-[60px] or w-16 etc)
        bottom_part = re.sub(
            r'<select\s+className="w-\[\d+px\][^"]+bg-v3-surface[^"]+"',
            f'<select className="{currency_select_standard}"',
            bottom_part
        )
        
        # 5. SearchableSelect fixes
        # Remove !min-h-[32px] and h-[32px] wrappers
        bottom_part = bottom_part.replace('className="rounded-lg h-[32px] !min-h-[32px]"', 'className="rounded-md h-[36px]"')
        bottom_part = bottom_part.replace('className="rounded-lg"', 'className="rounded-md h-[36px]"')
        bottom_part = bottom_part.replace('h-[32px] relative z-[60]', 'h-[36px] relative z-[60]')
        bottom_part = bottom_part.replace('h-[32px] relative z-[50]', 'h-[36px] relative z-[50]')
        bottom_part = bottom_part.replace('h-[32px] relative z-[40]', 'h-[36px] relative z-[40]')
        bottom_part = bottom_part.replace('h-[32px] relative z-[30]', 'h-[36px] relative z-[30]')
        
        # Make the "h-[32px]" grid rows to "h-[36px]"
        bottom_part = bottom_part.replace('h-[32px]', 'h-[36px]')
        
        content = top_part + start_tag + bottom_part
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Unified inputs in {filepath}")

