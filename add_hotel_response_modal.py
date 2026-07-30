import re

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# 1. Add states for the modal
states_to_add = """
  // Hotel Response Modal State
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedHotelForResponse, setSelectedHotelForResponse] = useState<any>(null);
  const [responsePrice, setResponsePrice] = useState("");
  const [responseCurrency, setResponseCurrency] = useState("EUR");
  const [responseOptionDate, setResponseOptionDate] = useState("");
  const [responseStatus, setResponseStatus] = useState("FİYAT GİRDİ");
"""
if "const [responseModalOpen, setResponseModalOpen]" not in text:
    text = text.replace("const [gala, setGala] = useState({ requested: false, date: \"\", notes: \"\" });", "const [gala, setGala] = useState({ requested: false, date: \"\", notes: \"\" });\n" + states_to_add)

# 2. Add handleSaveResponse function
save_func = """
  const handleSaveResponse = async () => {
    if (!selectedHotelForResponse) return;
    try {
      const { error } = await supabase
        .from("mice_request_hotels")
        .update({
          status: responseStatus,
          price: responsePrice ? Number(responsePrice) : null,
          currency: responseCurrency,
          option_date: responseOptionDate || null
        })
        .eq("request_id", requestId)
        .eq("hotel_id", selectedHotelForResponse.hotel_id);

      if (error) throw error;
      toast.success("Otel yanıtı başarıyla güncellendi!");
      setResponseModalOpen(false);
      
      // Refresh hotel responses
      const { data } = await supabase.from("mice_requests").select(`*, mice_request_hotels(*, hotels(name))`).eq("id", requestId).single();
      if (data && data.mice_request_hotels) setHotelResponses(data.mice_request_hotels);
    } catch (err: any) {
      console.error(err);
      toast.error("Yanıt kaydedilemedi!");
    }
  };
"""
if "const handleSaveResponse = async ()" not in text:
    text = text.replace("const handleSave = async (sendMail: boolean) => {", save_func + "\n  const handleSave = async (sendMail: boolean) => {")

# 3. Update the "Yanıt Gir" button to open the modal
old_btn = """<button className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-v3-bg border border-v3-border hover:bg-gray-100 dark:hover:bg-gray-800 text-v3-text transition-colors">
                          Yanıt Gir
                        </button>"""
new_btn = """<button onClick={() => {
                          setSelectedHotelForResponse(hr);
                          setResponsePrice(hr.price ? hr.price.toString() : "");
                          setResponseCurrency(hr.currency || "EUR");
                          setResponseOptionDate(hr.option_date ? hr.option_date.split('T')[0] : "");
                          setResponseStatus(hr.status === "BEKLEMEDE" || hr.status === "MAİL GÖNDERİLDİ" ? "FİYAT GİRDİ" : hr.status);
                          setResponseModalOpen(true);
                        }} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-v3-bg border border-v3-border hover:bg-gray-100 dark:hover:bg-gray-800 text-v3-text transition-colors">
                          Yanıt Gir
                        </button>"""
text = text.replace(old_btn, new_btn)

# 4. Add the Modal JSX at the end of the return statement
modal_jsx = """
      {/* HOTEL RESPONSE MODAL */}
      {responseModalOpen && selectedHotelForResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-v3-surface rounded-2xl border border-v3-border p-6 shadow-2xl w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-v3-text mb-1">Otel Yanıtı Gir</h3>
            <p className="text-sm text-v3-muted mb-6">{selectedHotelForResponse.hotels?.name} için fiyat ve opsiyon belirleyin.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Durum</label>
                <select value={responseStatus} onChange={(e) => setResponseStatus(e.target.value)} className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                  <option value="BEKLEMEDE">Beklemede</option>
                  <option value="MAİL GÖNDERİLDİ">Mail Gönderildi</option>
                  <option value="FİYAT GİRDİ">Fiyat Girdi</option>
                  <option value="REDDEDİLDİ">Reddedildi</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Toplam Fiyat</label>
                  <input type="number" value={responsePrice} onChange={(e) => setResponsePrice(e.target.value)} className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="Örn: 50000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Para Birimi</label>
                  <select value={responseCurrency} onChange={(e) => setResponseCurrency(e.target.value)} className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Opsiyon Tarihi</label>
                <input type="date" value={responseOptionDate} onChange={(e) => setResponseOptionDate(e.target.value)} className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setResponseModalOpen(false)} className="flex-1 px-4 py-3 bg-v3-bg text-v3-text rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                İptal
              </button>
              <button onClick={handleSaveResponse} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
"""
if "HOTEL RESPONSE MODAL" not in text:
    text = text.replace("    </div>\n  );\n}", modal_jsx + "\n    </div>\n  );\n}")

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Injected Hotel Response Modal!")
