import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def fix_ts_errors(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Room fixes
    content = content.replace("rooms[0].hotelName", "(rooms[0] as any).hotelName")
    content = content.replace("rooms[0].concept", "(rooms[0] as any).concept")
    content = content.replace("rooms[0].paxInfo?.adults", "(rooms[0] as any).paxInfo?.adults")
    content = content.replace("r.salesAmount", "r.price")
    content = content.replace("rooms[0].salesAmount", "rooms[0].price")
    content = content.replace("r.purchaseAmount", "(r.costPrice || 0)")

    # Flight fixes
    content = content.replace("flights[0].departureDate", "(flights[0] as any).departureDate")
    content = content.replace("flights[0].returnDate", "(flights[0] as any).returnDate")
    content = content.replace("flights[0].pax", "(flights[0] as any).pax")
    content = content.replace("f.salesAmount", "f.price")
    content = content.replace("flights[0].salesAmount", "flights[0].price")
    content = content.replace("f.purchaseAmount", "(f.costPrice || 0)")

    # Transfer fixes
    content = content.replace("transfers[0].serviceType", "(transfers[0] as any).serviceType")
    content = content.replace("transfers[0].pax", "(transfers[0] as any).pax")
    content = content.replace("t.salesAmount", "t.price")
    content = content.replace("transfers[0].salesAmount", "transfers[0].price")
    content = content.replace("t.purchaseAmount", "(t.costPrice || 0)")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed TS errors in {filepath}")

for fp in files:
    fix_ts_errors(fp)
