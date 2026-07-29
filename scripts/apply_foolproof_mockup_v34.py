import re
import os

def fix_file(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Change grid-cols-5 to grid-cols-4 and col-span-5 to col-span-4
    # Note: we need to be careful as there might be other grid-cols-5. 
    # But in the context of the rooms accordion, it's:
    # <div className="flex-1 grid grid-cols-5 gap-3">
    content = content.replace('<div className="flex-1 grid grid-cols-5 gap-3">', '<div className="flex-1 grid grid-cols-4 gap-3">')
    
    # And the fallback text: <div className="col-span-5 text-gray-400
    content = content.replace('<div className="col-span-5 text-gray-400', '<div className="col-span-4 text-gray-400')

    # 2. Remove Konsept block
    konsept_block = """                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Konsept</p>
                            <p className="text-[10px] font-bold text-[#1e293b]">{(rooms[0] as any).concept || 'Bilinmiyor'}</p>
                          </div>"""
    content = content.replace(konsept_block, "")

    # 3. Fix Pax
    pax_old = "{(rooms[0] as any).paxInfo?.adults || 0}"
    pax_new = "{((rooms[0] as any).adultCount || 0) + ((rooms[0] as any).childCount || 0) + ((rooms[0] as any).infantCount || 0)}"
    content = content.replace(pax_old, pax_new)

    # 4. Fix Satış Tutarı
    sales_old = "{(rooms[0] as any).salesAmount || 0}"
    sales_new = "{(rooms[0] as any).price || (rooms[0] as any).totalPrice || 0}"
    content = content.replace(sales_old, sales_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_file("frontend/src/app/sejour/create/page.tsx")
fix_file("frontend/src/app/sejour/[id]/edit/page.tsx")
