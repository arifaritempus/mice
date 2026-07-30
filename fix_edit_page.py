import re

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# Change function signature to receive params
text = text.replace("export default function CreateRequestPage() {", "export default function EditRequestPage({ params }: { params: { id: string } }) {\n  const requestId = params.id;")
text = text.replace("Yeni Talep Oluştur", "Talebi Düzenle")
text = text.replace("Otel müsaitlik ve fiyat taleplerini tek tıkla çoklu otellere gönderin.", "Mevcut talebi düzenleyin, otellere tekrar mail atın veya teklife çevirin.")

# Add fetchRequest logic
fetch_request_code = """
  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        const { data, error } = await supabase
          .from("mice_requests")
          .select(`*, mice_request_hotels(hotel_id)`)
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
              setRoomCount(data.room_details.room?.toString() || "");
              setPaxCount(data.room_details.pax?.toString() || "");
            } else {
              setSng(data.room_details.sng?.toString() || "");
              setDbl(data.room_details.dbl?.toString() || "");
              setTrp(data.room_details.trp?.toString() || "");
            }
          }

          if (data.meeting) setMeeting({ requested: data.meeting.requested, date: data.meeting.date?.split("T")[0] || "", notes: data.meeting.notes || "" });
          if (data.cocktail) setCocktail({ requested: data.cocktail.requested, date: data.cocktail.date?.split("T")[0] || "", notes: data.cocktail.notes || "" });
          if (data.gala) setGala({ requested: data.gala.requested, date: data.gala.date?.split("T")[0] || "", notes: data.gala.notes || "" });

          if (data.mice_request_hotels) {
            setSelectedHotels(data.mice_request_hotels.map((h: any) => h.hotel_id));
          }
        }
      } catch (err: any) {
        console.error("Talep detayı alınamadı", err);
        toast.error("Talep detayları yüklenemedi.");
      }
    };
    fetchRequest();
  }, [requestId]);
"""

# Insert fetch logic after the initial fetchData useEffect
text = re.sub(r'(setHotels\(hotelsRes\.data as any\);\n\s*\}\n\s*\} catch.*?\n\s*\};\n\s*fetchData\(\);\n\s*\}, \[\]\);)', r'\1\n' + fetch_request_code, text, flags=re.DOTALL)

# Update handleSave to use UPDATE instead of INSERT
update_payload = """
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
"""
text = re.sub(r'const \{ data: reqData, error: reqErr \} = await supabase\s*\.from\("mice_requests"\)\s*\.insert\(\{.*?\)\s*\.select\(\)\s*\.single\(\);', update_payload, text, flags=re.DOTALL)

# Also update the mice_request_hotels insert logic to DELETE and re-INSERT for updates
hotel_update_logic = """
        await supabase.from("mice_request_hotels").delete().eq("request_id", requestId);
        
        if (selectedHotels.length > 0) {
          const hotelInserts = selectedHotels.map(hId => ({
            request_id: requestId,
            hotel_id: hId,
            status: "BEKLEMEDE"
          }));
          const { error: hotelErr } = await supabase.from("mice_request_hotels").insert(hotelInserts);
          if (hotelErr) console.error("Hotels link error", hotelErr);
        }
"""
text = re.sub(r'if \(selectedHotels\.length > 0\) \{\s*const hotelInserts = selectedHotels\.map\(hId => \(\{\s*request_id: reqData\.id,\s*hotel_id: hId,\s*status: "BEKLEMEDE"\s*\}\)\);\s*const \{ error: hotelErr \} = await supabase\.from\("mice_request_hotels"\)\.insert\(hotelInserts\);\s*if \(hotelErr\) console\.error\("Hotels link error", hotelErr\);\s*\}', hotel_update_logic, text, flags=re.DOTALL)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Scaffolded edit page successfully!")
