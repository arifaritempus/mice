import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# 1. Update the payload
old_payload = """          createdQuote = await quotesService.create({
            quote_number: quoteReference,
            client_name: companyName || "",
            reference: quoteReference,
            agency_id: agencyId || null,
            company_name: companyName || "",
            check_in_date: checkIn || null,
            check_out_date: checkOut || null,
            status: "TASLAK",
            quote_type: "MICE",
            notes: `Otomatik olarak ${reference} talebinden dönüştürüldü.`,
            total_amount: 0,
            currency: "EUR"
          } as any);"""

new_payload = """          createdQuote = await quotesService.create({
            quote_number: quoteReference,
            client_name: companyName || "",
            reference: quoteReference,
            agency_id: agencyId || null,
            company_name: companyName || "",
            check_in_date: checkIn || null,
            check_out_date: checkOut || null,
            status: "TEKLİF",
            quote_type: "BİRİM",
            notes: `Otomatik olarak ${reference} talebinden dönüştürüldü.`,
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
            })),
            total_amount: 0,
            currency: "EUR"
          } as any);"""

text = text.replace(old_payload, new_payload)

# 2. Update the router redirect
old_router = 'router.push(`/quotes/edit/${createdQuote.id}`);'
new_router = 'router.push(`/quotes/${createdQuote.id}`);'
text = text.replace(old_router, new_router)

# Note: The `quotes` table needs `hotels_data`, `room_count`, `pax_count`, `option`, `option_date` which I added!
# Wait, roomPax is available in the component! `const [roomPax, setRoomPax] = useState("");`

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Payload updated!")
