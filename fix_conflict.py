import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

old_logic = """      const createdQuote = await quotesService.create({
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

new_logic = """      let createdQuote = null;
      const { data: existingQuotes } = await supabase.from("quotes").select("*").eq("quote_number", quoteReference);
      
      if (existingQuotes && existingQuotes.length > 0) {
          createdQuote = existingQuotes[0];
          // Clean up any existing items from previous partial attempts
          await supabase.from("quote_items").delete().eq("quote_id", createdQuote.id);
      } else {
          createdQuote = await quotesService.create({
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
          } as any);
      }"""

text = text.replace(old_logic, new_logic)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("409 Conflict logic applied!")
