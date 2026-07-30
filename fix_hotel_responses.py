import re

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# We need to render the mice_request_hotels data in a table at the bottom of the page.
# Wait, first we need to make sure we fetch the FULL mice_request_hotels data, not just hotel_id
# We currently do:
# .select(`*, mice_request_hotels(hotel_id)`)
# We should change it to:
# .select(`*, mice_request_hotels(*, hotels(name))`)

text = text.replace("select(`*, mice_request_hotels(hotel_id)`)", "select(`*, mice_request_hotels(*, hotels(name))`)")

# In fetchRequest, we also need to store the full hotel responses in state
if "const [hotelResponses, setHotelResponses]" not in text:
    text = text.replace("const [selectedHotels, setSelectedHotels] = useState<string[]>([]);", "const [selectedHotels, setSelectedHotels] = useState<string[]>([]);\n  const [hotelResponses, setHotelResponses] = useState<any[]>([]);")

text = text.replace("setSelectedHotels(uniqueHotels as string[]);\n          }", "setSelectedHotels(uniqueHotels as string[]);\n            setHotelResponses(data.mice_request_hotels);\n          }")

# Now add the UI section for Hotel Responses right before the FOOTER ACTIONS
ui_section = """        </div>
        
        {/* HOTEL RESPONSES SECTION */}
        <div className="mt-8 bg-v3-surface rounded-2xl border border-v3-border p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-v3-border">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-v3-text">Otellerden Gelen Yanıtlar</h2>
              <p className="text-xs text-v3-muted mt-1">Mail attığınız otellerin dönüşlerini, fiyatlarını ve opsiyon tarihlerini buradan yönetin.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-v3-border">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-v3-bg border-b border-v3-border">
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">Otel Adı</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider text-center">Durum</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">Toplam Fiyat</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider">Opsiyon Tarihi</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-v3-muted uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {hotelResponses.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-v3-muted text-xs">Henüz otele gönderilmedi veya yanıt bekleniyor...</td></tr>
                ) : (
                  hotelResponses.map((hr, idx) => (
                    <tr key={idx} className="border-b border-v3-border last:border-b-0 hover:bg-v3-bg transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold text-v3-text">{hr.hotels?.name || "Bilinmiyor"}</td>
                      <td className="px-4 py-3 text-xs text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          hr.status === "MAİL GÖNDERİLDİ" ? "bg-blue-100 text-blue-700" :
                          hr.status === "FİYAT GİRDİ" ? "bg-emerald-100 text-emerald-700" :
                          hr.status === "REDDEDİLDİ" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {hr.status || "BEKLEMEDE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-v3-text font-medium">{hr.price ? hr.price + " " + (hr.currency || "EUR") : "-"}</td>
                      <td className="px-4 py-3 text-xs text-v3-text">{hr.option_date ? new Date(hr.option_date).toLocaleDateString('tr-TR') : "-"}</td>
                      <td className="px-4 py-3 text-xs text-right space-x-2">
                        <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-v3-bg border border-v3-border hover:bg-gray-100 dark:hover:bg-gray-800 text-v3-text transition-colors">
                          Yanıt Gir
                        </button>
                        <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                          TEKLİFE ÇEVİR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>"""

text = text.replace("</div>\n\n    </div>\n  );\n}", ui_section + "\n\n    </div>\n  );\n}")

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Added Hotel Responses table UI successfully!")
