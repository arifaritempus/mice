import sys
import re

mail_block = """      if (sendMail) {
        toast.info("Otellere mail gönderiliyor, lütfen bekleyin...");
        let successCount = 0;
        
        for (const hId of selectedHotels) {
          const hotel = hotels.find((h: any) => h.id === hId);
          if (!hotel) continue;
          
          const toAddress = hotel.cc_mail || hotel.email;
          if (!toAddress) {
            console.warn("Otelin e-posta adresi yok:", hotel.name);
            continue;
          }
          
          const eventsArr = [];
          if (meeting.requested) eventsArr.push(`📅 Toplantı (${meeting.date || "Tarih Yok"})`);
          if (cocktail.requested) eventsArr.push(`🍸 Welcome Cocktail (${cocktail.date || "Tarih Yok"})`);
          if (barNight.requested) eventsArr.push(`🍷 Bar Gecesi (${barNight.date || "Tarih Yok"})`);
          if (gala.requested) eventsArr.push(`🍽️ Gala Yemeği (${gala.date || "Tarih Yok"})`);
          
          const eventsHtml = eventsArr.map(e => `<span class="event-badge">${e}</span>`).join("");
          
          const roomPaxStr = roomType === "TOTAL" 
            ? `${roomCount} Oda / ${paxCount} Pax`
            : `SNG: ${sng}, DBL: ${dbl}, TRP: ${trp}`;
            
          const dateRangeStr = dateType === "EXACT"
            ? `${checkIn || "?"} - ${checkOut || "?"}`
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
      } else {"""

def update_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()
    
    # Update select query
    old_query = 'supabase.from("hotels").select("id, name").eq("is_active", true).order("name")'
    new_query = 'supabase.from("hotels").select("id, name, email, cc_mail, agency_cc_mail").eq("is_active", true).order("name")'
    content = content.replace(old_query, new_query)
    
    # Update sendMail block
    old_sendmail = """      if (sendMail) {
        toast.success("Talep kaydedildi ve otellere mail gönderimi tetiklendi!");
        // (Mail gönderim API'si buraya entegre edilecek)
      } else {"""
      
    content = content.replace(old_sendmail, mail_block)
    
    with open(filepath, "w") as f:
        f.write(content)

update_file("frontend/src/app/requests/create/page.tsx")
update_file("frontend/src/app/requests/edit/[id]/page.tsx")
print("Updated successfully!")
