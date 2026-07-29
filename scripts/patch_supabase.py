import re

with open("frontend/src/lib/supabaseService.ts", "r") as f:
    text = f.read()

# Fix Rooms Insert Payload (line 1941)
text = text.replace("check_in: room.checkIn || null,", "check_in_date: room.checkIn || null,")
text = text.replace("check_out: room.checkOut || null,", "check_out_date: room.checkOut || null,")

# Fix Rooms Update Payload (line 2271)
# It uses the exact same room.map
# Let's check if it does. If so, the replace above might catch both.

# Fix Extra Services Insert Payload (around line 2150)
text = text.replace(
    "service_description: service.description || service.serviceDescription || null,",
    "service_description: service.description || service.serviceDescription || null,\n          date: service.date || null,"
)

# Fix Extra Services Update Payload (around line 2370)
# It might also use the exact same mapping. If so, replace above caught both?
# Let's verify by checking how many replacements were made.
import sys

with open("frontend/src/lib/supabaseService.ts", "w") as f:
    f.write(text)

