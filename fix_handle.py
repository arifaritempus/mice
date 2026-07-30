import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# Add a direct query for hotel concepts to be bulletproof
query_insert = """      const { data: existingQuotes } = await supabase.from("quotes").select("*").eq("quote_number", quoteReference);
      
      const { data: dbHotels } = await supabase.from("hotels").select("id, concept").in("id", selectedHr.map((hr: any) => hr.hotel_id));"""

text = text.replace('      const { data: existingQuotes } = await supabase.from("quotes").select("*").eq("quote_number", quoteReference);', query_insert)

# Calculate final room and pax
room_pax_calc = """      const { data: dbHotels } = await supabase.from("hotels").select("id, concept").in("id", selectedHr.map((hr: any) => hr.hotel_id));
      
      const finalRoomCount = roomType === "TOTAL" ? (Number(roomCount) || 0) : ((Number(sng) || 0) + (Number(dbl) || 0) + (Number(trp) || 0));
      const finalPaxCount = roomType === "TOTAL" ? (Number(paxCount) || 0) : ((Number(sng) || 0) * 1 + (Number(dbl) || 0) * 2 + (Number(trp) || 0) * 3);"""

text = text.replace('      const { data: dbHotels } = await supabase.from("hotels").select("id, concept").in("id", selectedHr.map((hr: any) => hr.hotel_id));', room_pax_calc)

# Update the mappings
text = text.replace('room_count: roomCount || 0', 'room_count: finalRoomCount')
text = text.replace('pax_count: paxCount || 0', 'pax_count: finalPaxCount')

# Update the hotel concept mapping
text = text.replace('const hotelConcept = (hotels as any[]).find(h => h.id === hr.hotel_id)?.concept || "";', 'const hotelConcept = dbHotels?.find(h => h.id === hr.hotel_id)?.concept || (hotels as any[]).find(h => h.id === hr.hotel_id)?.concept || "";')

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Handle function fixed!")
