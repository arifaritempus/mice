import re

with open("scripts/v5_form_content.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Supplier Dropdowns to include Hotels and sort alphabetically
supplier_options_regex = r'options=\{suppliers\.map\(s\s*=>\s*\(\{\s*id:\s*s\.id,\s*name:\s*s\.name\s*\}\)\)\}'
new_supplier_options = 'options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))}'
content = re.sub(supplier_options_regex, new_supplier_options, content)

# 2. Flight PNR and Ticketing Date to Sales Tab
purchase_flight_regex = r'(<div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:\[&>\*:nth-child\(1\)\]:flex-\[2\] lg:\[&>\*:nth-child\(2\)\]:flex-\[1\] lg:\[&>\*:nth-child\(3\)\]:flex-\[1.5\] lg:\[&>\*:nth-child\(4\)\]:flex-\[1.5\]">[\s\S]*?)<div>\s*<label[^>]*>PNR</label>[\s\S]*?</div>\s*<div>\s*<label[^>]*>BİLET TARİHİ</label>[\s\S]*?</div>([\s\S]*?</div>\s*</div>)'
def replace_purchase_flight(m):
    return m.group(1) + m.group(2)
content = re.sub(purchase_flight_regex, replace_purchase_flight, content)

sales_flight_regex = r'(<div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:\[&>\*:nth-child\(1\)\]:flex-\[1\] lg:\[&>\*:nth-child\(2\)\]:flex-\[1\] lg:\[&>\*:nth-child\(3\)\]:flex-\[1.5\] lg:\[&>\*:nth-child\(4\)\]:flex-\[1\] lg:\[&>\*:nth-child\(5\)\]:flex-\[1.5\] lg:\[&>\*:nth-child\(6\)\]:flex-\[1.2\] mt-4">[\s\S]*?)(<div>\s*<label[^>]*>SATIŞ TUTARI</label>)'
pnr_bilet_html = """                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PNR</label>
                                <input type="text" placeholder="PNR" value={flight.pnr || ""} onChange={(e) => updateFlight(flight.id, "pnr", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">BİLET TARİHİ</label>
                                <input type="date" value={flight.ticketingDate || ""} onChange={(e) => updateFlight(flight.id, "ticketingDate", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>\n"""
def replace_sales_flight(m):
    text = m.group(1) + pnr_bilet_html + m.group(2)
    text = text.replace(
        "lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.5] lg:[&>*:nth-child(6)]:flex-[1.2]",
        "lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.2] lg:[&>*:nth-child(6)]:flex-[1] lg:[&>*:nth-child(7)]:flex-[1] lg:[&>*:nth-child(8)]:flex-[1.2]"
    )
    return text
content = re.sub(sales_flight_regex, replace_sales_flight, content)

# 3. Currency ordering and default to TRY
content = re.sub(r'value=\{([^}]*?)\.currency\s*\|\|\s*"USD"\}', r'value={\1.currency || "TRY"}', content)
content = re.sub(r'value=\{([^}]*?)\.costCurrency\s*\|\|\s*"USD"\}', r'value={\1.costCurrency || "TRY"}', content)
old_currency_options = r'<option value="USD">USD</option>\s*<option value="EUR">EUR</option>\s*<option value="TRY">TRY</option>\s*<option value="GBP">GBP</option>'
new_currency_options = '<option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>'
content = re.sub(old_currency_options, new_currency_options, content)
content = content.replace('useState("USD")', 'useState("TRY")')

# 4. Show Sales amount in Purchase Tab
def inject_sales_info(service_name, var_name, text_content):
    # Regex to find the ALIŞ (MALİYET) TUTARI div specifically inside the mapping of var_name
    # We find the supplier block for that var_name
    if var_name == "room":
        block_regex = r'(<div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:\[&>\*:nth-child\(1\)\]:flex-\[2\] lg:\[&>\*:nth-child\(2\)\]:flex-\[1\.5\]">[\s\S]*?)(<div>\s*<label[^>]*>ALIŞ \(MALİYET\) TUTARI</label>)'
    elif var_name == "flight":
        block_regex = r'(<div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:\[&>\*:nth-child\(1\)\]:flex-\[2\] lg:\[&>\*:nth-child\(2\)\]:flex-\[1\] lg:\[&>\*:nth-child\(3\)\]:flex-\[1\.5\] lg:\[&>\*:nth-child\(4\)\]:flex-\[1\.5\]">[\s\S]*?)(<div>\s*<label[^>]*>ALIŞ \(MALİYET\) TUTARI</label>)'
    elif var_name == "transfer":
        block_regex = r'(<div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:\[&>\*:nth-child\(1\)\]:flex-\[2\] lg:\[&>\*:nth-child\(2\)\]:flex-\[1\.5\] mt-4">[\s\S]*?)(<div>\s*<label[^>]*>ALIŞ \(MALİYET\) TUTARI</label>)'
    elif var_name == "service":
        block_regex = r'(<div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:\[&>\*:nth-child\(1\)\]:flex-\[2\] lg:\[&>\*:nth-child\(2\)\]:flex-\[1\.5\] mt-4">[\s\S]*?)(<div>\s*<label[^>]*>ALIŞ \(MALİYET\) TUTARI</label>)'

    sales_block = f"""                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                                  {{{var_name}.price ? {var_name}.price.toLocaleString("tr-TR") : "0"}} {{{var_name}.currency || "TRY"}}
                                </div>
                              </div>\n"""
                              
    def replacer(m):
        # Update the grid flex numbers to add 1 more column
        t = m.group(1)
        if var_name == "room":
            t = t.replace("lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1.5]", "lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]")
        elif var_name == "flight":
            t = t.replace("lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1.5]", "lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1.5] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1.5]")
            # actually flight purchase is: TEDARİKÇİ, PNR (removed), BİLET(removed), ALIŞ
            # wait, I already removed PNR and BİLET. So it's just TEDARİKÇİ and ALIŞ.
            # But the flex classes weren't updated in the earlier step! 
            t = re.sub(r'lg:\[&>\*:nth-child\(1\)\].*?flex-\[1\.5\]"', 'lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]"', t)
        elif var_name == "transfer":
            t = t.replace("lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1.5]", "lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]")
        elif var_name == "service":
            t = t.replace("lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1.5]", "lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]")

        return t + sales_block + m.group(2)
        
    return re.sub(block_regex, replacer, text_content)

content = inject_sales_info("Room", "room", content)
content = inject_sales_info("Flight", "flight", content)
content = inject_sales_info("Transfer", "transfer", content)
content = inject_sales_info("ExtraService", "service", content)

# 5. Collection tab ordering: Tarih, Yöntem, Açıklama, Tutar
old_collection_item = r'<div className="col-span-1">\s*<label[^>]*>YÖNTEM</label>[\s\S]*?</div>\s*<div className="col-span-1">\s*<label[^>]*>TUTAR</label>[\s\S]*?</div>\s*<div className="col-span-1">\s*<label[^>]*>TARİH</label>[\s\S]*?</div>\s*<div className="col-span-3">\s*<label[^>]*>AÇIKLAMA</label>[\s\S]*?</div>'
new_collection_item = """                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH</label>
                        <input type="date" value={collection.date || ""} onChange={(e) => updateCollection(collection.id, "date", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">YÖNTEM</label>
                        <select value={collection.type || "cash"} onChange={(e) => updateCollection(collection.id, "type", e.target.value)} className="w-full h-[36px] px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                          <option value="cash">Nakit</option>
                          <option value="bank">Havale / EFT</option>
                          <option value="credit_card">Kredi Kartı</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">AÇIKLAMA</label>
                        <input type="text" placeholder="Tahsilat notu..." value={collection.description || ""} onChange={(e) => updateCollection(collection.id, "description", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TUTAR VE BİRİM</label>
                        <div className="flex gap-1 h-[36px]">
                          <input type="number" value={collection.amount || 0} onChange={(e) => updateCollection(collection.id, "amount", parseFloat(e.target.value) || 0)} className="w-full px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold outline-none" />
                          <select value={collection.currency || "TRY"} onChange={(e) => updateCollection(collection.id, "currency", e.target.value)} className="w-[60px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                            <option value="TRY">TRY</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>"""
content = re.sub(old_collection_item, new_collection_item, content)

with open("scripts/v6_form_content.tsx", 'w', encoding='utf-8') as f:
    f.write(content)
