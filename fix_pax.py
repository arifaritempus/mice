import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# Replace roomPax.split in the new payload section
text = text.replace('Number(roomPax.split("/")[0]) || 0', 'roomCount || 0')
text = text.replace('Number(roomPax.split("/")[1]) || 0', 'paxCount || 0')

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Room and Pax variables fixed!")
