import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# Fix option mapping in hotels_data
text = text.replace('option: hr.option_type,', 'option: hr.response_details?.option_type || "",')
text = text.replace('option_date: hr.option_date,', 'option_date: hr.response_details?.option_date || null,')

# Wait, there's also the main quote option fields:
# option: firstHr?.option_type || "",
# option_date: firstHr?.option_date || null,
text = text.replace('option: firstHr?.option_type || "",', 'option: firstHr?.response_details?.option_type || "",')
text = text.replace('option_date: firstHr?.option_date || null,', 'option_date: firstHr?.response_details?.option_date || null,')

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Options fixed!")
