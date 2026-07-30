import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

old_payload = """      const createdQuote = await quotesService.create({
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

new_payload = """      const createdQuote = await quotesService.create({
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

text = text.replace(old_payload, new_payload)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Quote creation payload fixed!")
