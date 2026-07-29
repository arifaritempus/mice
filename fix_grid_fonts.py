import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We only want to apply these inside the room grid block.
    # To do this safely, we find the start of the block and the end.
    start_tag = '<div className="flex flex-col lg:flex-row gap-2 items-end w-full">'
    end_tag = '</div>\n                          </div>'
    
    parts = content.split(start_tag)
    if len(parts) > 1:
        new_content = parts[0]
        for i in range(1, len(parts)):
            sub_parts = parts[i].split(end_tag, 1)
            if len(sub_parts) > 1:
                block = sub_parts[0]
                
                # 1. Labels
                block = block.replace('text-[9px] font-black', 'text-[9px] font-semibold')
                
                # 2. Inputs & Selects
                block = block.replace('text-[10px] font-bold', 'text-[10px] font-medium')
                
                # 3. Price
                block = block.replace('text-[11px] font-black', 'text-[11px] font-semibold')
                
                # 4. Currency
                block = block.replace('text-[10px] font-black', 'text-[10px] font-medium')
                
                # 5. Adjust Flex Ratios
                block = block.replace('className="flex-[1.5] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Otel Seçimi', 
                                      'className="flex-[2] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Otel Seçimi')
                                      
                block = block.replace('className="flex-[1] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Konaklama Tipi',
                                      'className="flex-[1.2] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Konaklama Tipi')
                                      
                block = block.replace('className="flex-[1] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Oda Tipi',
                                      'className="flex-[1.2] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Oda Tipi')
                                      
                block = block.replace('className="flex-[2] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Misafir Bilgileri',
                                      'className="flex-[1.5] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Misafir Bilgileri')
                                      
                block = block.replace('className="flex-[1.5] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Satış Tutarı',
                                      'className="flex-[1.6] w-full">\n                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">\n                                Satış Tutarı')

                # Reconstruct
                new_content += start_tag + block + end_tag + sub_parts[1]
            else:
                new_content += start_tag + parts[i]
                
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed fonts and widths for {filepath}")

