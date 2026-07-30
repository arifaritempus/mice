import sys

with open("frontend/src/app/quotes/[id]/page.tsx", "r") as f:
    text = f.read()

old_pax = "{hotelsData ? hotelsData.reduce((acc: number, h: any) => acc + (Number(h.room_count) || 0), 0) : 0} | {hotelsData ? hotelsData.reduce((acc: number, h: any) => acc + (Number(h.pax_count) || 0), 0) : 0}"
new_pax = "{quote.room_count || 0} | {quote.pax_count || 0}"

text = text.replace(old_pax, new_pax)

with open("frontend/src/app/quotes/[id]/page.tsx", "w") as f:
    f.write(text)

print("Quote UI Pax Fixed!")
