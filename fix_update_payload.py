import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

old_logic = """      if (existingQuotes && existingQuotes.length > 0) {
          createdQuote = existingQuotes[0];
          // Clean up any existing items from previous partial attempts
          await supabase.from("quote_items").delete().eq("quote_id", createdQuote.id);
      }"""

new_logic = """      if (existingQuotes && existingQuotes.length > 0) {
          createdQuote = existingQuotes[0];
          // Clean up any existing items from previous partial attempts
          await supabase.from("quote_items").delete().eq("quote_id", createdQuote.id);
          
          // Update existing quote fields to ensure they match current selection
          await supabase.from("quotes").update({
            status: "TEKLİF",
            quote_type: "BİRİM",
            room_count: Number(roomPax.split("/")[0]) || 0,
            pax_count: Number(roomPax.split("/")[1]) || 0,
            option: firstHr?.option_type || "",
            option_date: firstHr?.option_date || null,
            hotels_data: selectedHr.map((hr: any) => ({
              id: hr.hotel_id,
              hotel_id: hr.hotel_id,
              check_in_date: checkIn || null,
              check_out_date: checkOut || null,
              option_type: hr.option_type,
              option_date: hr.option_date
            }))
          }).eq("id", createdQuote.id);
      }"""

text = text.replace(old_logic, new_logic)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Update payload applied!")
