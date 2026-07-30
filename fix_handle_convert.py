import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

main_return_marker = "  return (\n    <div className=\"flex flex-col h-full bg-v3-bg\">"

func_logic = """
  const handleConvertToQuote = async () => {
    if (selectedQuoteHotels.length === 0) return;
    setIsConverting(true);
    try {
      const date = new Date();
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const reference = `MICE-${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}-${randomPart}`;

      const selectedHr = hotelResponses.filter((hr: any) => selectedQuoteHotels.includes(hr.hotel_id));
      const firstHr = selectedHr[0];

      const createdQuote = await quotesService.create({
        reference,
        agency_id: formData.agency_id || null,
        company_name: formData.company_name || "",
        check_in_date: checkIn || null,
        check_out_date: checkOut || null,
        status: "TASLAK",
        quote_type: "MICE",
        notes: `Otomatik olarak ${formData.reference} talebinden dönüştürüldü.`,
        total_amount: 0,
        currency: "EUR"
      } as any);

      let total = 0;
      let currency = "EUR";
      const isValidUUID = (id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      for (const hr of selectedHr) {
         if (hr.response_details?.prices && Array.isArray(hr.response_details.prices)) {
             for (const price of hr.response_details.prices) {
                 const itemVal = Number(price.total) || Number(price.unit_price) || 0;
                 total += itemVal;
                 currency = price.currency || currency;
                 
                 await quoteItemsService.create({
                    quote_id: createdQuote.id,
                    reference: createdQuote.reference,
                    main_category: isValidUUID(price.main_category) ? price.main_category : null,
                    sub_category: isValidUUID(price.sub_category) ? price.sub_category : (isValidUUID(price.category_id) ? price.category_id : null),
                    unit_quantity: price.unit_quantity || 1,
                    sefer: price.sefer || 1,
                    unit_price: price.unit_price || price.price || 0,
                    currency: price.currency || "EUR",
                    total: itemVal,
                    total_try: price.total_try || 0,
                    description: (price.description || "") + ` [T:${hr.hotel_id}]`,
                    vat: price.vat || 0,
                    hotel_id: hr.hotel_id
                 } as any);
             }
         }
      }

      await supabase.from("quotes").update({ total_amount: total, currency }).eq("id", createdQuote.id);

      toast.success("Teklif başarıyla oluşturuldu!");
      router.push(`/quotes/edit/${createdQuote.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error("Teklife dönüştürülürken hata oluştu!");
    } finally {
      setIsConverting(false);
      setQuoteModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-v3-bg">
"""

if "const handleConvertToQuote" not in text:
    text = text.replace(main_return_marker, func_logic)
    with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
        f.write(text)
    print("handleConvertToQuote injected successfully!")
else:
    print("handleConvertToQuote already exists!")

