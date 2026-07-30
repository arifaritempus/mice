import re

with open("frontend/src/app/requests/create/page.tsx", "r") as f:
    text = f.read()

# Import ResponsiveDateField
if "ResponsiveDateField" not in text:
    text = text.replace('import { toast } from "react-hot-toast";', 'import { toast } from "react-hot-toast";\nimport ResponsiveDateField from "@/components/ResponsiveDateField";')

# 1. Replace request date input with ResponsiveDateField
request_date_html = """                <div>
                  <label className="block text-xs font-semibold text-v3-muted uppercase tracking-wider mb-1.5">Talep Tarihi</label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>"""
request_date_new = """                <ResponsiveDateField
                  label="Talep Tarihi"
                  value={requestDate}
                  onChange={setRequestDate}
                />"""
text = text.replace(request_date_html, request_date_new)

# 2. Replace C-IN and C-OUT with ResponsiveDateField
c_in_html = """                    <div>
                      <label className="block text-[10px] font-semibold text-v3-muted uppercase tracking-wider mb-1.5">C-IN Tarihi</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => {
                           const newDate = e.target.value;
                           setCheckIn(newDate);
                           if (newDate && checkOut) {
                              const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(newDate).getTime());
                              setNights(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                           }
                        }}
                        className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>"""
c_in_new = """                    <ResponsiveDateField
                      label="C-IN Tarihi"
                      value={checkIn}
                      onChange={(newDate) => {
                         setCheckIn(newDate);
                         if (newDate && checkOut) {
                            const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(newDate).getTime());
                            setNights(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                         }
                      }}
                    />"""
text = text.replace(c_in_html, c_in_new)

c_out_html = """                    <div>
                      <label className="block text-[10px] font-semibold text-v3-muted uppercase tracking-wider mb-1.5">C-OUT Tarihi</label>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || undefined}
                        onChange={(e) => {
                           const newDate = e.target.value;
                           setCheckOut(newDate);
                           if (newDate && checkIn) {
                              const diffTime = Math.abs(new Date(newDate).getTime() - new Date(checkIn).getTime());
                              setNights(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                           }
                        }}
                        className="w-full bg-v3-bg border border-v3-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>"""
c_out_new = """                    <ResponsiveDateField
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
                    />"""
text = text.replace(c_out_html, c_out_new)

# 3. Events: meeting, cocktail, gala date inputs
meeting_html = """                      <div>
                        <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Tarih (Opsiyonel)</label>
                        <input
                          type="date"
                          value={meeting.date}
                          onChange={(e) => setMeeting({...meeting, date: e.target.value})}
                          className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>"""
meeting_new = """                      <ResponsiveDateField
                        label="Tarih (Opsiyonel)"
                        value={meeting.date}
                        onChange={(d) => setMeeting({...meeting, date: d})}
                      />"""
text = text.replace(meeting_html, meeting_new)

cocktail_html = """                      <div>
                        <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Tarih (Opsiyonel)</label>
                        <input
                          type="date"
                          value={cocktail.date}
                          onChange={(e) => setCocktail({...cocktail, date: e.target.value})}
                          className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500"
                        />
                      </div>"""
cocktail_new = """                      <ResponsiveDateField
                        label="Tarih (Opsiyonel)"
                        value={cocktail.date}
                        onChange={(d) => setCocktail({...cocktail, date: d})}
                      />"""
text = text.replace(cocktail_html, cocktail_new)

gala_html = """                      <div>
                        <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Tarih (Opsiyonel)</label>
                        <input
                          type="date"
                          value={gala.date}
                          onChange={(e) => setGala({...gala, date: e.target.value})}
                          className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>"""
gala_new = """                      <ResponsiveDateField
                        label="Tarih (Opsiyonel)"
                        value={gala.date}
                        onChange={(d) => setGala({...gala, date: d})}
                      />"""
text = text.replace(gala_html, gala_new)

# Standardize Heights and Fonts for text areas and other small inputs
# SearchableSelect has py-2.5 text-sm, MultiHotelSelect has py-2 text-sm min-h-[44px]. 
# Let's fix MultiHotelSelect padding to match
text = text.replace('px-4 py-2 text-sm cursor-pointer min-h-[44px]', 'px-4 py-2.5 text-sm cursor-pointer min-h-[44px]')

# Fix textareas in events (make them same padding)
text = text.replace('px-3 py-2 text-xs resize-none', 'px-4 py-2.5 text-sm resize-none')

with open("frontend/src/app/requests/create/page.tsx", "w") as f:
    f.write(text)
    
print("Updated request form UI perfectly")
