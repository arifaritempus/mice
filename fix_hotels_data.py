import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

old_hotels_data = """            hotels_data: selectedHr.map((hr: any) => ({
              id: hr.hotel_id,
              hotel_id: hr.hotel_id,
              check_in_date: checkIn || null,
              check_out_date: checkOut || null,
              option_type: hr.option_type,
              option_date: hr.option_date
            }))"""

new_hotels_data = """            hotels_data: selectedHr.map((hr: any) => {
              let hRoom = 0;
              let hPax = 0;
              if (hr.response_details?.prices && Array.isArray(hr.response_details.prices)) {
                  hr.response_details.prices.forEach((p: any) => {
                      const catName = categories.find((c: any) => c.id === (p.category_id || p.sub_category))?.name || "";
                      const q = Number(p.unit_quantity) || 0;
                      if (catName.includes("DOUBLE") || catName.includes("DBL")) { hRoom += q / 2; hPax += q; }
                      else if (catName.includes("SINGLE") || catName.includes("SNG")) { hRoom += q; hPax += q; }
                      else if (catName.includes("TRIPLE") || catName.includes("TRP")) { hRoom += q / 3; hPax += q; }
                      else if (catName.includes("QUAD")) { hRoom += q / 4; hPax += q; }
                  });
              }
              const hotelConcept = (hotels as any[]).find(h => h.id === hr.hotel_id)?.concept || "";
              return {
                id: hr.hotel_id,
                hotel_id: hr.hotel_id,
                check_in_date: checkIn || null,
                check_out_date: checkOut || null,
                option: hr.option_type,
                option_date: hr.option_date,
                hotel_concept: hotelConcept,
                room_count: Math.ceil(hRoom),
                pax_count: hPax
              };
            })"""

# Notice I changed option_type to option in the output!

text = text.replace(old_hotels_data, new_hotels_data)

# Since hotels_data appears TWICE (in existingQuotes block and else block), it will replace both!

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("hotels_data updated!")
