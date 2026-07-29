import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v23(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Safely replace addRoom
    old_room = """      price: 0,
      currency: "TRY",
    };
    setRooms([...rooms, newRoom]);"""
    
    new_room = """      price: 0,
      currency: "TRY",
      checkInDate: salesData.checkInDate || "",
      checkOutDate: salesData.checkOutDate || "",
    };
    setRooms([...rooms, newRoom]);"""
    
    # If the file has slightly different spacing, we can use regex
    # Match: currency: "TRY", \n }; \n setRooms([...rooms, newRoom]);
    room_pattern = re.compile(r'(currency:\s*"TRY",\s*\n\s*\};\s*\n\s*setRooms\(\[\.\.\.rooms,\s*newRoom\]\);)')
    def room_repl(m):
        return '      checkInDate: salesData.checkInDate || "",\n      checkOutDate: salesData.checkOutDate || "",\n' + m.group(1)
    
    content = room_pattern.sub(room_repl, content)

    # Replace flight ticketing date
    # Only replace if it matches ticketingDate: "",
    content = content.replace('ticketingDate: "",', 'ticketingDate: new Date().toISOString().split(\'T\')[0],')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY UPDATED DEFAULT DATES IN {filepath}")

for fp in files:
    apply_v23(fp)
