import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# 1. Imports
if "import { quotesService, quoteItemsService } from \"@/lib/supabaseService\";" not in text:
    text = text.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport { quotesService, quoteItemsService } from "@/lib/supabaseService";')

# 2. States
states_marker = "const [showAddRow, setShowAddRow] = useState(false);"
new_states = """  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedQuoteHotels, setSelectedQuoteHotels] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);"""
text = text.replace(states_marker, states_marker + "\n" + new_states)

# 3. Add top button
top_btn_marker = "Kaydet & Mail Gönder\n            </button>"
new_top_btn = """Kaydet & Mail Gönder
            </button>
            <button
              type="button"
              onClick={() => {
                const priced = requestHotels.filter((hr: any) => hr.status === "FİYAT GİRDİ");
                setSelectedQuoteHotels(priced.map((hr: any) => hr.hotel_id));
                setQuoteModalOpen(true);
              }}
              className="flex items-center gap-1.5 h-10 px-4 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Seçili Otelleri Teklife Çevir
            </button>"""
text = text.replace(top_btn_marker, new_top_btn)

# 4. Remove inline button
inline_btn_marker = """<button className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                          TEKLİFE ÇEVİR
                        </button>"""
text = text.replace(inline_btn_marker, "")

# 5. Conversion Function (Place BEFORE line 435 return)
func_logic = """
  const handleConvertToQuote = async () => {
    if (selectedQuoteHotels.length === 0) return;
    setIsConverting(true);
    try {
      const date = new Date();
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const reference = `MICE-${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}-${randomPart}`;

      const selectedHr = requestHotels.filter((hr: any) => selectedQuoteHotels.includes(hr.hotel_id));
      const firstHr = selectedHr[0];

      const createdQuote = await quotesService.create({
        reference,
        agency_id: formData.agency_id || "",
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
"""
text = text.replace("  return (\n    <div className=\"min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-20\">", func_logic + "    <div className=\"min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-20\">")

# 6. Modal JSX (Place right before the final closing </div>)
modal_jsx = """
      {/* MULTI QUOTE CONVERSION MODAL */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-v3-surface rounded-2xl border border-v3-border p-6 shadow-2xl w-full max-w-2xl m-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-v3-text mb-1">Teklife Dönüştür</h3>
                <p className="text-sm text-v3-muted">Teklife dönüştürmek istediğiniz otelleri seçin.</p>
              </div>
              <button onClick={() => setQuoteModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {requestHotels.filter((hr: any) => hr.status === "FİYAT GİRDİ").length === 0 ? (
                <div className="p-4 text-center text-sm text-v3-muted bg-v3-bg rounded-xl border border-dashed border-v3-border">
                  Fiyat girilmiş otel bulunamadı. Lütfen önce otellere fiyat girin.
                </div>
              ) : (
                requestHotels.filter((hr: any) => hr.status === "FİYAT GİRDİ").map((hr: any) => (
                  <label key={hr.hotel_id} className="flex items-center gap-3 p-4 bg-v3-bg border border-v3-border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={selectedQuoteHotels.includes(hr.hotel_id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedQuoteHotels([...selectedQuoteHotels, hr.hotel_id]);
                        else setSelectedQuoteHotels(selectedQuoteHotels.filter(id => id !== hr.hotel_id));
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-v3-text">{hr.hotels?.name}</div>
                      <div className="text-xs text-v3-muted mt-1">
                        Toplam: {hr.price || 0} {hr.currency} | Opsiyon: {hr.option_date ? new Date(hr.option_date).toLocaleDateString('tr-TR') : "-"}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setQuoteModalOpen(false)} className="flex-1 px-4 py-3 bg-v3-bg text-v3-text rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                İptal
              </button>
              <button 
                onClick={handleConvertToQuote}
                disabled={selectedQuoteHotels.length === 0 || isConverting}
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {isConverting && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                Teklife Dönüştür
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""

text = text.replace("    </div>\n  );\n}", modal_jsx)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Multi-quote logic added precisely!")
