import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

old_payload = """                 await quoteItemsService.create({
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
                 } as any);"""

new_payload = """                 await quoteItemsService.create({
                    quote_id: createdQuote.id,
                    reference: createdQuote.reference,
                    main_category: isValidUUID(price.main_category) ? price.main_category : null,
                    sub_category: isValidUUID(price.sub_category) ? price.sub_category : (isValidUUID(price.category_id) ? price.category_id : null),
                    unit_quantity: price.unit_quantity || 1,
                    sefer: price.sefer || 1,
                    unit_price: price.unit_price || price.price || 0,
                    currency: price.currency || "EUR",
                    total: itemVal,
                    total_price: itemVal,
                    total_try: price.total_try || 0,
                    description: (price.description || "") + ` [T:${hr.hotel_id}]`,
                    vat: price.vat || 0,
                    hotel_id: hr.hotel_id
                 } as any);"""

text = text.replace(old_payload, new_payload)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Quote items payload fixed!")
