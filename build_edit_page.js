const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/requests/edit/[id]/page.tsx', 'utf-8');

// 1. Signature
code = code.replace(
  'export default function CreateRequestPage() {',
  `import React from "react";\n\nexport default function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {\n  const { id: requestId } = React.use(params);`
);

// 2. Titles
code = code.replace('"Yeni Talep Oluştur"', '"Talebi Düzenle"');
code = code.replace('"Otel müsaitlik ve fiyat taleplerini tek tıkla çoklu otellere gönderin."', '"Mevcut talebi düzenleyin, otellere tekrar mail atın veya teklife çevirin."');

// 3. States
const newStates = `
  const [hotelResponses, setHotelResponses] = useState<any[]>([]);
  
  // Hotel Response Modal State
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedHotelForResponse, setSelectedHotelForResponse] = useState<any>(null);
  const [responsePrice, setResponsePrice] = useState("");
  const [responseCurrency, setResponseCurrency] = useState("EUR");
  const [responseOptionDate, setResponseOptionDate] = useState("");
  const [responseStatus, setResponseStatus] = useState("FİYAT GİRDİ");
`;
code = code.replace('const [notes, setNotes] = useState("");', 'const [notes, setNotes] = useState("");\n' + newStates);

// 4. fetchRequest
const fetchRequestLogic = `
  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        const { data, error } = await supabase
          .from("mice_requests")
          .select(\`*, mice_request_hotels(*, hotels(name))\`)
          .eq("id", requestId)
          .single();

        if (error) throw error;
        if (data) {
          if (data.request_date) setRequestDate(data.request_date.split("T")[0]);
          setReference(data.reference || "");
          setCompanyName(data.company_name || "");
          setAgencyId(data.agency_id || "");
          setNotes(data.notes || "");
          
          setDateType(data.date_type || "EXACT");
          if (data.date_type === "EXACT" && data.date_details) {
            setCheckIn(data.date_details.check_in?.split("T")[0] || "");
            setCheckOut(data.date_details.check_out?.split("T")[0] || "");
          } else if (data.date_details) {
            setFlexibleDateText(data.date_details.text || "");
          }
          setNights(data.nights || 0);

          if (data.room_details) {
            setRoomType(data.room_details.type || "TOTAL");
            if (data.room_details.type === "TOTAL") {
              setRoomCount(data.room_details.room || 0);
              setPaxCount(data.room_details.pax || 0);
            } else {
              setSng(data.room_details.sng || 0);
              setDbl(data.room_details.dbl || 0);
              setTrp(data.room_details.trp || 0);
            }
          }

          if (data.meeting) setMeeting({ requested: data.meeting.requested, date: data.meeting.date?.split("T")[0] || "", notes: data.meeting.notes || "" });
          if (data.cocktail) setCocktail({ requested: data.cocktail.requested, date: data.cocktail.date?.split("T")[0] || "", notes: data.cocktail.notes || "" });
          if (data.gala) setGala({ requested: data.gala.requested, date: data.gala.date?.split("T")[0] || "", notes: data.gala.notes || "" });

          if (data.mice_request_hotels) {
            const uniqueHotels = Array.from(new Set(data.mice_request_hotels.map((h: any) => h.hotel_id)));
            setSelectedHotels(uniqueHotels as string[]);
            setHotelResponses(data.mice_request_hotels);
          }
        }
      } catch (err: any) {
        console.error("Talep detayı alınamadı", err);
        toast.error("Talep detayları yüklenemedi.");
      }
    };
    fetchRequest();
  }, [requestId]);
`;
code = code.replace('fetchData();\n  }, []);', 'fetchData();\n  }, []);\n' + fetchRequestLogic);


// 5. handleSaveResponse
const saveResponseLogic = `
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
      
      const { data } = await supabase.from("mice_requests").select(\`*, mice_request_hotels(*, hotels(name))\`).eq("id", requestId).single();
      if (data && data.mice_request_hotels) setHotelResponses(data.mice_request_hotels);
    } catch (err: any) {
      console.error(err);
      toast.error("Yanıt kaydedilemedi!");
    }
  };
`;
code = code.replace('const handleSave = async (sendMail: boolean) => {', saveResponseLogic + '\n  const handleSave = async (sendMail: boolean) => {');

// 6. Update handleSave to use UPDATE and delete/re-insert hotels
const oldHandleSavePart1 = `
      const { data: reqData, error: reqErr } = await supabase
        .from("mice_requests")
        .insert({
          request_date: requestDate || null,
          reference,
          company_name: companyName,
          agency_id: agencyId,
          date_type: dateType,
          date_details: dateType === "EXACT" ? { check_in: checkIn || null, check_out: checkOut || null } : { text: flexibleDateText },
          nights: Number(nights),
          room_details: roomType === "TOTAL" ? { type: "TOTAL", room: Number(roomCount), pax: Number(paxCount) } : { type: "DETAILED", sng: Number(sng), dbl: Number(dbl), trp: Number(trp) },
          meeting: { requested: meeting.requested, date: meeting.date || null, notes: meeting.notes },
          cocktail: { requested: cocktail.requested, date: cocktail.date || null, notes: cocktail.notes },
          gala: { requested: gala.requested, date: gala.date || null, notes: gala.notes },
          notes: notes,
          status: sendMail ? "MAİL GÖNDERİLDİ" : "BEKLEMEDE"
        })
        .select()
        .single();
`;

const newHandleSavePart1 = `
      const { data: reqData, error: reqErr } = await supabase
        .from("mice_requests")
        .update({
          request_date: requestDate || null,
          reference,
          company_name: companyName,
          agency_id: agencyId,
          date_type: dateType,
          date_details: dateType === "EXACT" ? { check_in: checkIn || null, check_out: checkOut || null } : { text: flexibleDateText },
          nights: Number(nights),
          room_details: roomType === "TOTAL" ? { type: "TOTAL", room: Number(roomCount), pax: Number(paxCount) } : { type: "DETAILED", sng: Number(sng), dbl: Number(dbl), trp: Number(trp) },
          meeting: { requested: meeting.requested, date: meeting.date || null, notes: meeting.notes },
          cocktail: { requested: cocktail.requested, date: cocktail.date || null, notes: cocktail.notes },
          gala: { requested: gala.requested, date: gala.date || null, notes: gala.notes },
          notes: notes,
          status: sendMail ? "MAİL GÖNDERİLDİ" : "BEKLEMEDE"
        })
        .eq("id", requestId)
        .select()
        .single();
`;
code = code.replace(oldHandleSavePart1, newHandleSavePart1);

const oldHandleSavePart2 = `
      // 2. Insert mice_request_hotels
      const hotelInserts = selectedHotels.map(hId => ({
        request_id: reqData.id,
        hotel_id: hId,
        status: "BEKLEMEDE"
      }));

      const { error: hotelErr } = await supabase.from("mice_request_hotels").insert(hotelInserts);
      if (hotelErr) throw hotelErr;
`;

const newHandleSavePart2 = `
      // 2. Update mice_request_hotels (Delete all and re-insert)
      await supabase.from("mice_request_hotels").delete().eq("request_id", requestId);
      
      if (selectedHotels.length > 0) {
        const hotelInserts = selectedHotels.map(hId => ({
          request_id: reqData.id,
          hotel_id: hId,
          status: "BEKLEMEDE"
        }));

        const { error: hotelErr } = await supabase.from("mice_request_hotels").insert(hotelInserts);
        if (hotelErr) throw hotelErr;
      }
`;
code = code.replace(oldHandleSavePart2, newHandleSavePart2);

// 7. Inject Hotel Responses UI and Modal at the end
const endCode = `
        {/* 7. OTELLERDEN GELEN YANITLAR */}
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
                        <span className={\`px-2.5 py-1 rounded-full text-[10px] font-bold \${
                          hr.status === "MAİL GÖNDERİLDİ" ? "bg-blue-100 text-blue-700" :
                          hr.status === "FİYAT GİRDİ" ? "bg-emerald-100 text-emerald-700" :
                          hr.status === "REDDEDİLDİ" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }\`}>
                          {hr.status || "BEKLEMEDE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-v3-text font-medium">{hr.price ? hr.price + " " + (hr.currency || "EUR") : "-"}</td>
                      <td className="px-4 py-3 text-xs text-v3-text">{hr.option_date ? new Date(hr.option_date).toLocaleDateString('tr-TR') : "-"}</td>
                      <td className="px-4 py-3 text-xs text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => {
                          setSelectedHotelForResponse(hr);
                          setResponsePrice(hr.price ? hr.price.toString() : "");
                          setResponseCurrency(hr.currency || "EUR");
                          setResponseOptionDate(hr.option_date ? hr.option_date.split('T')[0] : "");
                          setResponseStatus(hr.status === "BEKLEMEDE" || hr.status === "MAİL GÖNDERİLDİ" ? "FİYAT GİRDİ" : hr.status);
                          setResponseModalOpen(true);
                        }} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-v3-bg border border-v3-border hover:bg-gray-100 dark:hover:bg-gray-800 text-v3-text transition-colors">
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

      </div>

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
    </div>
  );
}
`;

code = code.replace('      </div>\n    </div>\n  );\n}', endCode);

fs.writeFileSync('frontend/src/app/requests/edit/[id]/page.tsx', code);
console.log("Successfully rebuilt edit page!");
