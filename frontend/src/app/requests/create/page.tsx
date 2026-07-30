"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import ResponsiveDateField from "@/components/ResponsiveDateField";

// Inline Searchable Select
const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) =>
    (opt.name || "").toLowerCase().includes(search.toLowerCase())
  );
  
  const selectedOption = options.find((opt: any) => opt.id === value);

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={selectedOption ? "text-v3-text" : "text-v3-muted"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg className={`w-4 h-4 text-v3-muted transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-v3-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-v3-border">
            <input
              type="text"
              className="w-full bg-v3-bg border border-v3-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-v3-muted text-center">Sonuç bulunamadı</div>
            ) : (
              filteredOptions.map((opt: any) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${value === opt.id ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" : "hover:bg-v3-surface text-v3-text"}`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// MultiSelect for Hotels
const MultiHotelSelect = ({ options, selectedValues, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) =>
    (opt.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v: string) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm cursor-pointer min-h-[44px] flex items-center flex-wrap gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {selectedValues.length === 0 ? (
          <span className="text-v3-muted">Otel(ler) seçin veya arayın...</span>
        ) : (
          selectedValues.map((id: string) => {
            const h = options.find((o: any) => o.id === id);
            if (!h) return null;
            return (
              <span key={id} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1" onClick={(e) => { e.stopPropagation(); toggleSelection(id); }}>
                {h.name}
                <svg className="w-3 h-3 cursor-pointer hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </span>
            );
          })
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-v3-border rounded-xl shadow-lg max-h-72 overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-v3-border z-10">
            <input
              type="text"
              autoFocus
              className="w-full bg-v3-bg border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Otel adı ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredOptions.length > 0) {
                  e.preventDefault();
                  toggleSelection(filteredOptions[0].id);
                }
              }}
            />
          </div>
          <div className="p-1 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-v3-muted text-center">Sonuç bulunamadı</div>
            ) : (
              filteredOptions.map((opt: any) => {
                const isSelected = selectedValues.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors flex items-center justify-between ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "hover:bg-v3-surface text-v3-text"}`}
                    onClick={() => toggleSelection(opt.id)}
                  >
                    <span>{opt.name}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default function CreateRequestPage() {
  const router = useRouter();
  
  const [agencies, setAgencies] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  
  // Date State
  const [dateType, setDateType] = useState<"EXACT" | "FLEXIBLE">("EXACT");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [flexibleDateText, setFlexibleDateText] = useState("");
  const [nights, setNights] = useState<number>(0);

  // Room State
  const [roomType, setRoomType] = useState<"TOTAL" | "DETAILED">("TOTAL");
  const [roomCount, setRoomCount] = useState<number>(0);
  const [paxCount, setPaxCount] = useState<number>(0);
  const [sng, setSng] = useState<number>(0);
  const [dbl, setDbl] = useState<number>(0);
  const [trp, setTrp] = useState<number>(0);

  // Event State
  const [meeting, setMeeting] = useState({ requested: false, date: "", notes: "" });
  const [cocktail, setCocktail] = useState({ requested: false, date: "", notes: "" });
  const [gala, setGala] = useState({ requested: false, date: "", notes: "" });
  const [barNight, setBarNight] = useState({ requested: false, date: "", notes: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agenciesRes, hotelsRes] = await Promise.all([
          supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
          supabase.from("hotels").select("id, name, email, cc_mail, agency_cc_mail").eq("is_active", true).order("name")
        ]);
        if (agenciesRes.data) setAgencies(agenciesRes.data as any);
        if (hotelsRes.data) setHotels(hotelsRes.data as any);
      } catch (error) {
        console.error("Error loading dictionaries:", error);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (sendMail: boolean) => {
    if (!companyName || !agencyId || selectedHotels.length === 0) {
      toast.error("Lütfen Firma Adı, Acente ve en az 1 Otel seçiniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Insert mice_requests
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
          bar_night: { requested: barNight.requested, date: barNight.date || null, notes: barNight.notes },
          gala: { requested: gala.requested, date: gala.date || null, notes: gala.notes },
          notes: notes,
          status: sendMail ? "MAİL GÖNDERİLDİ" : "BEKLEMEDE"
        })
        .select()
        .single();

      if (reqErr) throw reqErr;

      // 2. Insert mice_request_hotels
      const hotelInserts = selectedHotels.map(hId => ({
        request_id: reqData.id,
        hotel_id: hId,
        status: "BEKLEMEDE"
      }));

      const { error: hotelErr } = await supabase.from("mice_request_hotels").insert(hotelInserts);
      if (hotelErr) throw hotelErr;

      if (sendMail) {
        toast("Otellere mail gönderiliyor, lütfen bekleyin...", { icon: '⏳' });
        let successCount = 0;
        
        for (const hId of selectedHotels) {
          const hotel = hotels.find((h: any) => h.id === hId);
          if (!hotel) continue;
          
          const toAddress = hotel.cc_mail || hotel.email;
          if (!toAddress) {
            console.warn("Otelin e-posta adresi yok:", hotel.name);
            continue;
          }
          
          const formatDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return "";
            const parts = dateStr.split("-");
            if (parts.length === 3) {
              return `${parts[2]}.${parts[1]}.${parts[0]}`;
            }
            return dateStr;
          };

          const eventsArr = [];
          if (meeting.requested) eventsArr.push(meeting.date ? `📅 Toplantı (${formatDate(meeting.date)})` : "📅 Toplantı");
          if (cocktail.requested) eventsArr.push(cocktail.date ? `🍸 Welcome Cocktail (${formatDate(cocktail.date)})` : "🍸 Welcome Cocktail");
          if (barNight.requested) eventsArr.push(barNight.date ? `🍷 Bar Gecesi (${formatDate(barNight.date)})` : "🍷 Bar Gecesi");
          if (gala.requested) eventsArr.push(gala.date ? `🍽️ Gala Yemeği (${formatDate(gala.date)})` : "🍽️ Gala Yemeği");
          
          const eventsHtml = eventsArr.map(e => `<span class="event-badge">${e}</span>`).join("");
          
          const roomPaxStr = roomType === "TOTAL" 
            ? `${roomCount} Oda / ${paxCount} Pax`
            : `SNG: ${sng}, DBL: ${dbl}, TRP: ${trp}`;
            
          const dateRangeStr = dateType === "EXACT"
            ? `${formatDate(checkIn) || "?"} - ${formatDate(checkOut) || "?"}`
            : flexibleDateText || "?";

          try {
            await fetch("/api/send-request-mail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: toAddress,
                cc: hotel.agency_cc_mail ? [hotel.agency_cc_mail] : undefined,
                requestData: {
                  reference: reqData.reference,
                  company_name: companyName,
                  date_range: dateRangeStr,
                  nights: Number(nights),
                  room_pax: roomPaxStr,
                  events_html: eventsHtml,
                  notes: notes
                },
                hotelData: {
                  name: hotel.name
                }
              })
            });
            successCount++;
          } catch (e) {
            console.error("Mail gönderilemedi:", hotel.name, e);
          }
        }
        
        toast.success(`Talep kaydedildi ve ${successCount} otele mail gönderildi!`);
      } else {
        toast.success("Talep başarıyla kaydedildi!");
      }
      
      router.push("/requests");
      
    } catch (err: any) {
      console.error(err);
      toast.error("Kaydetme sırasında hata oluştu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-v3-bg">
      <div className="flex-1 overflow-auto p-4 md:p-6 pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-v3-surface border border-v3-border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-v3-text">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h1 className="text-2xl font-light text-v3-text">Yeni Talep Oluştur</h1>
            </div>
            <p className="text-xs text-v3-muted mt-2 ml-11">
              Otel müsaitlik ve fiyat taleplerini tek tıkla çoklu otellere gönderin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-v3-border bg-v3-surface text-v3-text text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
            >
              Kaydet
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              Kaydet & Mail Gönder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Sol Kolon: Temel Bilgiler & Otel */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-v3-surface rounded-2xl border border-v3-border p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-v3-text mb-4 border-b border-v3-border pb-2">1. Temel Bilgiler</h2>
              
              <div className="space-y-4">
                <ResponsiveDateField
                  label="Talep Tarihi"
                  value={requestDate}
                  onChange={setRequestDate}
                />
                <div>
                  <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Referans</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Talep referansı veya kodu..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Firma / Sektör <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Müşteri firma adı..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Acente <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={agencies}
                    value={agencyId}
                    onChange={setAgencyId}
                    placeholder="Acente seçiniz..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-v3-surface rounded-2xl border border-v3-border p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-v3-text mb-4 border-b border-v3-border pb-2">2. Hedef Oteller</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Oteller <span className="text-red-500">*</span></span>
                    <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full text-[10px]">{selectedHotels.length} Seçili</span>
                  </label>
                  <MultiHotelSelect
                    options={hotels}
                    selectedValues={selectedHotels}
                    onChange={setSelectedHotels}
                  />
                  <p className="text-[10px] text-v3-muted mt-2 leading-relaxed">
                    Birden fazla otel seçebilirsiniz. Listede arama yapıp Enter tuşu ile hızlıca ekleyebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orta Kolon: Tarih & Geceleme */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-v3-surface rounded-2xl border border-v3-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-v3-border pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-v3-text">3. Tarih Planı</h2>
                
                {/* Date Type Toggle */}
                <div className="flex bg-v3-bg p-0.5 rounded-lg border border-v3-border">
                  <button
                    onClick={() => setDateType("EXACT")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${dateType === "EXACT" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-v3-muted hover:text-v3-text"}`}
                  >
                    NET TARİH
                  </button>
                  <button
                    onClick={() => setDateType("FLEXIBLE")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${dateType === "FLEXIBLE" ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-v3-muted hover:text-v3-text"}`}
                  >
                    ESNEK
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {dateType === "EXACT" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <ResponsiveDateField
                      label="C-IN Tarihi"
                      value={checkIn}
                      onChange={(newDate) => {
                         setCheckIn(newDate);
                         if (newDate && checkOut) {
                            const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(newDate).getTime());
                            setNights(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                         }
                      }}
                    />
                    <ResponsiveDateField
                      label="C-OUT Tarihi"
                      value={checkOut}
                      minDate={checkIn}
                      onChange={(newDate) => {
                         setCheckOut(newDate);
                         if (newDate && checkIn) {
                            const diffTime = Math.abs(new Date(newDate).getTime() - new Date(checkIn).getTime());
                            setNights(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                         }
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Esnek Tarih Talebi</label>
                    <textarea
                      value={flexibleDateText}
                      onChange={(e) => setFlexibleDateText(e.target.value)}
                      rows={3}
                      className="w-full bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Örn: Ekim 2026 son haftası veya Kasım ilk haftası. Sadece haftasonu tercih ediliyor..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Toplam Geceleme</label>
                  <input
                    type="number"
                    min="0"
                    value={nights}
                    onChange={(e) => setNights(Number(e.target.value))}
                    className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="bg-v3-surface rounded-2xl border border-v3-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-v3-border pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-v3-text">4. Oda / Pax</h2>
                
                {/* Room Type Toggle */}
                <div className="flex bg-v3-bg p-0.5 rounded-lg border border-v3-border">
                  <button
                    onClick={() => setRoomType("TOTAL")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${roomType === "TOTAL" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-v3-muted hover:text-v3-text"}`}
                  >
                    SADECE TOPLAM
                  </button>
                  <button
                    onClick={() => setRoomType("DETAILED")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${roomType === "DETAILED" ? "bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400" : "text-v3-muted hover:text-v3-text"}`}
                  >
                    SNG/DBL DETAYLI
                  </button>
                </div>
              </div>

              {roomType === "TOTAL" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Toplam Oda</label>
                    <input type="number" min="0" value={roomCount} onChange={(e) => setRoomCount(Number(e.target.value))} className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-center" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Toplam Kişi (Pax)</label>
                    <input type="number" min="0" value={paxCount} onChange={(e) => setPaxCount(Number(e.target.value))} className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-center" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-800/50">
                    <label className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5 text-center">SNG ODA</label>
                    <input type="number" min="0" value={sng} onChange={(e) => setSng(Number(e.target.value))} className="w-full bg-white dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-center" />
                  </div>
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5 text-center">DBL ODA</label>
                    <input type="number" min="0" value={dbl} onChange={(e) => setDbl(Number(e.target.value))} className="w-full bg-white dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center" />
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 text-center">TRP ODA</label>
                    <input type="number" min="0" value={trp} onChange={(e) => setTrp(Number(e.target.value))} className="w-full bg-white dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-center" />
                  </div>
                  
                  <div className="col-span-3 mt-2 text-center text-[10px] text-v3-muted font-medium bg-gray-50 dark:bg-gray-800/50 py-1.5 rounded-lg border border-v3-border">
                    Tahmini Toplam: <span className="font-bold text-v3-text">{sng + dbl + trp} Oda / {sng + (dbl*2) + (trp*3)} Pax</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sağ Kolon: Etkinlikler */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-v3-surface rounded-2xl border border-v3-border p-5 shadow-sm h-full">
              <h2 className="text-sm font-bold uppercase tracking-wider text-v3-text mb-4 border-b border-v3-border pb-2">5. Etkinlik Detayları</h2>
              
              <div className="space-y-6">
                {/* Cocktail */}
                <div className={`p-4 rounded-xl border transition-all ${cocktail.requested ? "bg-rose-50/30 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800" : "bg-v3-bg border-v3-border"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500" checked={cocktail.requested} onChange={(e) => setCocktail({...cocktail, requested: e.target.checked})} />
                    <span className="font-semibold text-sm text-v3-text">Welcome Cocktail</span>
                  </label>
                  
                  {cocktail.requested && (
                    <div className="mt-4 space-y-3 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                      <ResponsiveDateField
                        label="Tarih (Opsiyonel)"
                        value={cocktail.date}
                        onChange={(d) => setCocktail({...cocktail, date: d})}
                      />
                    </div>
                  )}
                </div>

                {/* Bar Gecesi */}
                <div className={`p-4 rounded-xl border transition-all ${barNight.requested ? "bg-blue-50/30 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800" : "bg-v3-bg border-v3-border"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500" checked={barNight.requested} onChange={(e) => setBarNight({...barNight, requested: e.target.checked})} />
                    <span className="font-semibold text-sm text-v3-text">Bar Gecesi</span>
                  </label>
                  
                  {barNight.requested && (
                    <div className="mt-4 space-y-3 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                      <ResponsiveDateField
                        label="Tarih (Opsiyonel)"
                        value={barNight.date}
                        onChange={(d) => setBarNight({...barNight, date: d})}
                      />
                      <div>
                        <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Not / Konsept</label>
                        <textarea rows={2} value={barNight.notes} onChange={(e) => setBarNight({...barNight, notes: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-4 py-2.5 text-sm resize-none" placeholder="Limitsiz yerli/yabancı alkol, DJ vb..." />
                      </div>
                    </div>
                  )}
                </div>

                {/* Toplantı */}
                <div className={`p-4 rounded-xl border transition-all ${meeting.requested ? "bg-amber-50/30 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800" : "bg-v3-bg border-v3-border"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500" checked={meeting.requested} onChange={(e) => setMeeting({...meeting, requested: e.target.checked})} />
                    <span className="font-semibold text-sm text-v3-text">Toplantı İsteniyor</span>
                  </label>
                  
                  {meeting.requested && (
                    <div className="mt-4 space-y-3 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                      <ResponsiveDateField
                        label="Tarih (Opsiyonel)"
                        value={meeting.date}
                        onChange={(d) => setMeeting({...meeting, date: d})}
                      />
                      <div>
                        <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Not / Düzen</label>
                        <textarea rows={2} value={meeting.notes} onChange={(e) => setMeeting({...meeting, notes: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-4 py-2.5 text-sm resize-none" placeholder="U-Düzen, Tiyatro vb..." />
                      </div>
                    </div>
                  )}
                </div>

                {/* Gala */}
                <div className={`p-4 rounded-xl border transition-all ${gala.requested ? "bg-indigo-50/30 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800" : "bg-v3-bg border-v3-border"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500" checked={gala.requested} onChange={(e) => setGala({...gala, requested: e.target.checked})} />
                    <span className="font-semibold text-sm text-v3-text">Gala Yemeği</span>
                  </label>
                  
                  {gala.requested && (
                    <div className="mt-4 space-y-3 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                      <ResponsiveDateField
                        label="Tarih (Opsiyonel)"
                        value={gala.date}
                        onChange={(d) => setGala({...gala, date: d})}
                      />
                      <div>
                        <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Not / Konsept</label>
                        <textarea rows={2} value={gala.notes} onChange={(e) => setGala({...gala, notes: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-4 py-2.5 text-sm resize-none" placeholder="Canlı müzik, limitsiz alkol vb..." />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* 6. Genel Notlar */}
        <div className="mt-6 bg-v3-surface rounded-2xl border border-v3-border p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-v3-text mb-4 border-b border-v3-border pb-2">6. Genel Notlar</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Talebe eklemek istediğiniz genel notlar, özel istekler veya uyarılar..."
          />
        </div>

      </div>
    </div>
  );
}
