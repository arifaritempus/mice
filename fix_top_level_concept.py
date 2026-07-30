import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# For update payload
update_old = """            pax_count: finalPaxCount,
            option: firstHr?.response_details?.option_type || "",
            option_date: firstHr?.response_details?.option_date || null,"""
update_new = """            pax_count: finalPaxCount,
            option: firstHr?.response_details?.option_type || "",
            option_date: firstHr?.response_details?.option_date || null,
            hotel_concept: dbHotels?.find((h: any) => h.id === firstHr?.hotel_id)?.concept || (hotels as any[]).find((h: any) => h.id === firstHr?.hotel_id)?.concept || "", """
text = text.replace(update_old, update_new)

# For insert payload
insert_old = """            pax_count: finalPaxCount,
            option: firstHr?.response_details?.option_type || "",
            option_date: firstHr?.response_details?.option_date || null,
            hotels_data: selectedHr"""
insert_new = """            pax_count: finalPaxCount,
            option: firstHr?.response_details?.option_type || "",
            option_date: firstHr?.response_details?.option_date || null,
            hotel_concept: dbHotels?.find((h: any) => h.id === firstHr?.hotel_id)?.concept || (hotels as any[]).find((h: any) => h.id === firstHr?.hotel_id)?.concept || "",
            hotels_data: selectedHr"""
text = text.replace(insert_old, insert_new)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Top level hotel concept fixed!")
