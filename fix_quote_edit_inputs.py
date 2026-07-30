import sys
import re

with open("frontend/src/app/quotes/[id]/edit/page.tsx", "r") as f:
    text = f.read()

# Replace formData values
text = text.replace('value={formData.reference}', 'value={formData.reference ?? ""}')
text = text.replace('value={formData.company_name}', 'value={formData.company_name ?? ""}')
text = text.replace('value={formData.agency_id}', 'value={formData.agency_id ?? ""}')
text = text.replace('value={formData.notes}', 'value={formData.notes ?? ""}')

# Replace hotel values
text = text.replace('value={h.hotel_concept}', 'value={h.hotel_concept ?? ""}')
text = text.replace('value={h.check_in_date}', 'value={h.check_in_date ?? ""}')
text = text.replace('value={h.check_out_date}', 'value={h.check_out_date ?? ""}')
text = text.replace('value={h.room_count}', 'value={h.room_count ?? ""}')
text = text.replace('value={h.pax_count}', 'value={h.pax_count ?? ""}')
text = text.replace('value={h.option}', 'value={h.option ?? ""}')
text = text.replace('value={h.option_date}', 'value={h.option_date ?? ""}')

with open("frontend/src/app/quotes/[id]/edit/page.tsx", "w") as f:
    f.write(text)

print("Quote edit page inputs fixed!")
