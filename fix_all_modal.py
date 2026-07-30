import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# 1. Fetch categories
if "const [categories, setCategories] = useState<any[]>([]);" not in text:
    text = text.replace("const [hotels, setHotels] = useState([]);", "const [hotels, setHotels] = useState([]);\n  const [categories, setCategories] = useState<any[]>([]);")
    text = text.replace("supabase.from(\"agencies\").select(\"id, name\").eq(\"is_active\", true).order(\"name\"),", "supabase.from(\"agencies\").select(\"id, name\").eq(\"is_active\", true).order(\"name\"),\n          supabase.from(\"categories\").select(\"id, name, parent_id\").order(\"name\"),")
    text = text.replace("if (hotelsRes.data) setHotels(hotelsRes.data as any);", "if (hotelsRes.data) setHotels(hotelsRes.data as any);\n        const catRes = await supabase.from(\"categories\").select(\"id, name, parent_id\").order(\"name\");\n        if (catRes.data) setCategories(catRes.data);")

# 2. States
old_states = """  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedHotelForResponse, setSelectedHotelForResponse] = useState<any>(null);
  const [responsePrice, setResponsePrice] = useState("");
  const [responseCurrency, setResponseCurrency] = useState("EUR");
  const [responseOptionDate, setResponseOptionDate] = useState("");
  const [responseStatus, setResponseStatus] = useState("FİYAT GİRDİ");"""
new_states = """  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedHotelForResponse, setSelectedHotelForResponse] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState("FİYAT GİRDİ");
  const [respCIn, setRespCIn] = useState("");
  const [respCOut, setRespCOut] = useState("");
  const [respOptionType, setRespOptionType] = useState("1. Opsiyon");
  const [respOptionDate, setRespOptionDate] = useState("");
  const [responseLines, setResponseLines] = useState<any[]>([]);"""
text = text.replace(old_states, new_states)

# 3. handleSaveResponse
old_save = """  const handleSaveResponse = async () => {
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
        .eq("hotel_id", selectedHotelForResponse.hotel_id);"""
new_save = """  const handleSaveResponse = async () => {
    if (!selectedHotelForResponse) return;
    try {
      const details = {
        c_in: respCIn,
        c_out: respCOut,
        option_type: respOptionType,
        option_date: respOptionDate,
        prices: responseLines.filter((l: any) => l.category_id && l.price)
      };
      
      const totalAmount = responseLines.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

      const { error } = await supabase
        .from("mice_request_hotels")
        .update({
          status: responseStatus,
          price: totalAmount > 0 ? totalAmount : null,
          currency: responseLines[0]?.currency || "EUR",
          option_date: respOptionDate || null,
          response_details: details
        })
        .eq("request_id", requestId)
        .eq("hotel_id", selectedHotelForResponse.hotel_id);"""
text = text.replace(old_save, new_save)

# 4. Table UI
old_th = """<th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">Toplam Fiyat</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">Opsiyon Tarihi</th>"""
new_th = """<th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">Opsiyon Durumu</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">Opsiyon Tarihi</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">DBL Oda (PP)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">SNG Oda</th>"""
text = text.replace(old_th, new_th)

old_td = """<td className="px-4 py-3 text-xs text-v3-text font-medium">{hr.price ? hr.price + " " + (hr.currency || "EUR") : "-"}</td>
                      <td className="px-4 py-3 text-xs text-v3-text">{hr.option_date ? new Date(hr.option_date).toLocaleDateString('tr-TR') : "-"}</td>"""
new_td = """<td className="px-4 py-3 text-xs text-v3-text font-medium">{hr.response_details?.option_type || "-"}</td>
                      <td className="px-4 py-3 text-xs text-v3-text">{hr.option_date ? new Date(hr.option_date).toLocaleDateString('tr-TR') : "-"}</td>
                      <td className="px-4 py-3 text-xs text-v3-text font-medium">
                        {(() => {
                           const dbl = hr.response_details?.prices?.find((p: any) => p.category_id === categories.find((c: any) => c.name.includes("DOUBLE") || c.name.includes("DBL"))?.id);
                           return dbl && dbl.price ? dbl.price + " " + dbl.currency : "-";
                        })()}
                      </td>
                      <td className="px-4 py-3 text-xs text-v3-text font-medium">
                        {(() => {
                           const sng = hr.response_details?.prices?.find((p: any) => p.category_id === categories.find((c: any) => c.name.includes("SINGLE") || c.name.includes("SNG"))?.id);
                           return sng && sng.price ? sng.price + " " + sng.currency : "-";
                        })()}
                      </td>"""
text = text.replace(old_td, new_td)

old_btn = """<button onClick={() => {
                          setSelectedHotelForResponse(hr);
                          setResponsePrice(hr.price ? hr.price.toString() : "");
                          setResponseCurrency(hr.currency || "EUR");
                          setResponseOptionDate(hr.option_date ? hr.option_date.split('T')[0] : "");
                          setResponseStatus(hr.status === "BEKLEMEDE" || hr.status === "MAİL GÖNDERİLDİ" ? "FİYAT GİRDİ" : hr.status);
                          setResponseModalOpen(true);
                        }}"""
new_btn = """<button onClick={() => {
                          setSelectedHotelForResponse(hr);
                          setResponseStatus(hr.status === "BEKLEMEDE" || hr.status === "MAİL GÖNDERİLDİ" ? "FİYAT GİRDİ" : hr.status);
                          
                          const details = hr.response_details || {};
                          setRespCIn(details.c_in || checkIn);
                          setRespCOut(details.c_out || checkOut);
                          setRespOptionType(details.option_type || "1. Opsiyon");
                          setRespOptionDate(details.option_date || "");
                          setResponseLines(details.prices || []);
                          if (!details.prices || details.prices.length === 0) {
                             setResponseLines([{ id: Date.now().toString(), category_id: "", price: "", currency: "EUR" }]);
                          }
                          setResponseModalOpen(true);
                        }}"""
text = text.replace(old_btn, new_btn)

# 5. Modal JSX
old_modal_start = "{/* HOTEL RESPONSE MODAL */}"
old_modal_end = "  );\n}"
idx_start = text.find(old_modal_start)
if idx_start != -1:
    text_before = text[:idx_start]
    
    new_modal = """{/* HOTEL RESPONSE MODAL */}
      {responseModalOpen && selectedHotelForResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-v3-surface rounded-2xl border border-v3-border p-6 shadow-2xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-v3-text mb-1">Otel Yanıtı Gir</h3>
                <p className="text-sm text-v3-muted">{selectedHotelForResponse.hotels?.name} için fiyat ve opsiyon belirleyin.</p>
              </div>
              <button onClick={() => setResponseModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-v3-border">
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Durum</label>
                  <select value={responseStatus} onChange={(e) => setResponseStatus(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="BEKLEMEDE">Beklemede</option>
                    <option value="MAİL GÖNDERİLDİ">Mail Gönderildi</option>
                    <option value="FİYAT GİRDİ">Fiyat Girdi</option>
                    <option value="REDDEDİLDİ">Reddedildi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Opsiyon Tipi</label>
                  <select value={respOptionType} onChange={(e) => setRespOptionType(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="1. Opsiyon">1. Opsiyon</option>
                    <option value="2. Opsiyon">2. Opsiyon</option>
                    <option value="Sor-Sat">Sor-Sat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Opsiyon Tarihi</label>
                  <input type="date" value={respOptionDate} onChange={(e) => setRespOptionDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Tarih Aralığı (C-IN / C-OUT)</label>
                  <div className="flex gap-2">
                    <input type="date" value={respCIn} onChange={(e) => setRespCIn(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-2 py-2 text-xs focus:outline-none" />
                    <input type="date" value={respCOut} onChange={(e) => setRespCOut(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-2 py-2 text-xs focus:outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-v3-muted uppercase">Fiyat Kalemleri</label>
                  <button onClick={() => setResponseLines([...responseLines, { id: Date.now().toString(), category_id: "", price: "", currency: "EUR" }])} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Yeni Kalem Ekle
                  </button>
                </div>
                
                <div className="space-y-3">
                  {responseLines.map((line: any, idx: number) => (
                    <div key={line.id} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <select value={line.category_id} onChange={(e) => {
                          const newLines = [...responseLines];
                          newLines[idx].category_id = e.target.value;
                          setResponseLines(newLines);
                        }} className="w-full bg-v3-bg border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                          <option value="">Kategori Seçiniz...</option>
                          {categories.filter(c => c.parent_id).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <input type="number" placeholder="Tutar" value={line.price} onChange={(e) => {
                          const newLines = [...responseLines];
                          newLines[idx].price = e.target.value;
                          setResponseLines(newLines);
                        }} className="w-full bg-v3-bg border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="w-24">
                        <select value={line.currency} onChange={(e) => {
                          const newLines = [...responseLines];
                          newLines[idx].currency = e.target.value;
                          setResponseLines(newLines);
                        }} className="w-full bg-v3-bg border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="TRY">TRY</option>
                        </select>
                      </div>
                      <button onClick={() => {
                        setResponseLines(responseLines.filter(l => l.id !== line.id));
                      }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  {responseLines.length === 0 && (
                     <div className="p-4 text-center text-sm text-v3-muted bg-v3-bg rounded-xl border border-dashed border-v3-border">Henüz fiyat kalemi eklenmedi.</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setResponseModalOpen(false)} className="flex-1 px-4 py-3 bg-v3-bg text-v3-text rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                İptal
              </button>
              <button onClick={handleSaveResponse} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors">
                Yanıtı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""
    text = text_before + new_modal

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Applied UI fixes, deleted total price from table, added option type and DBL/SNG!")
