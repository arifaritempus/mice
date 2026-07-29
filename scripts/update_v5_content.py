import re

with open("scripts/v5_form_content.tsx", 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove overflow-hidden from accordion items so dropdowns don't get cut off
content = content.replace("shadow-sm overflow-hidden p-4 relative", "shadow-sm p-4 relative")
# Also the main header card
content = content.replace("rounded-xl shadow-sm overflow-hidden", "rounded-xl shadow-sm")

# 2. Update Sejour Bilgileri with Customer Type
old_agency = """                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Acente Seçimi *</label>
                        <div className="h-[36px]">
                          <SearchableSelect options={agencies.map(a => ({id: a.id, name: a.name}))} value={salesData.agencyId} onChange={(val) => setSalesData(prev => ({...prev, agencyId: val}))} placeholder="Acente ara..." />
                        </div>
                      </div>"""

new_customer_type = """                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Müşteri Tipi *</label>
                        <select name="customerType" value={salesData.customerType || "agency"} onChange={(e) => setSalesData(prev => ({...prev, customerType: e.target.value, agencyId: "", customerName: ""}))} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                          <option value="agency">Acente</option>
                          <option value="individual">Şahıs</option>
                        </select>
                      </div>
                      {salesData.customerType === "agency" ? (
                        <div className="relative z-[100]">
                          <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Acente Seçimi *</label>
                          <div className="h-[36px]">
                            <SearchableSelect options={agencies.map(a => ({id: a.id, name: a.name}))} value={salesData.agencyId} onChange={(val) => setSalesData(prev => ({...prev, agencyId: val}))} placeholder="Acente ara..." />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Şahıs (Ad Soyad) *</label>
                          <input type="text" name="customerName" value={salesData.customerName || ""} onChange={handleInputChange} placeholder="İsim Soyisim..." className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                        </div>
                      )}"""

content = content.replace(old_agency, new_customer_type)

# Fix the grid flex numbers for the header to fit 7 items
content = content.replace(
    "lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1.5] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1] lg:[&>*:nth-child(6)]:flex-[2]",
    "lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1] lg:[&>*:nth-child(6)]:flex-[1] lg:[&>*:nth-child(7)]:flex-[1.5]"
)

# 3. Add Accommodation Type to Rooms
old_room_type = """                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ODA TİPİ</label>
                                <select value={room.roomType || ""} onChange={(e) => updateRoom(room.id, "roomType", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-blue-500 outline-none">
                                  <option value="">Seçin</option>
                                  {roomTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>"""

new_room_type = old_room_type + """\n                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KONAK. TİPİ</label>
                                <select value={room.accommodationType || ""} onChange={(e) => updateRoom(room.id, "accommodationType", e.target.value)} className="w-full h-[36px] px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-blue-500 outline-none">
                                  <option value="">Seçin</option>
                                  <option value="SNG">SNG</option>
                                  <option value="DBL">DBL</option>
                                  <option value="TRP">TRP</option>
                                  <option value="QUAD">QUAD</option>
                                  <option value="CHLD">CHLD</option>
                                </select>
                              </div>"""

content = content.replace(old_room_type, new_room_type)

# Fix room flex grid
content = content.replace(
    "lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1.5] lg:[&>*:nth-child(5)]:flex-[1.5] lg:[&>*:nth-child(6)]:flex-[1.2]",
    "lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.5] lg:[&>*:nth-child(6)]:flex-[1.5] lg:[&>*:nth-child(7)]:flex-[1.2]"
)

# 4. Fix Transfer Route Description missing value and onChange
old_transfer_route = """<input type="text" placeholder="Örn: Otel - Havalimanı" className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />"""
new_transfer_route = """<input type="text" value={transfer.routeDescription || ""} onChange={(e) => updateTransfer(transfer.id, "routeDescription", e.target.value)} placeholder="Örn: Otel - Havalimanı" className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />"""
content = content.replace(old_transfer_route, new_transfer_route)

with open("scripts/v5_form_content.tsx", 'w', encoding='utf-8') as f:
    f.write(content)
