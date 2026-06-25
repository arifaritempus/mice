import re

with open('frontend/src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Add usersService to imports
import_search = r'  marketingService,\n\} from "@/lib/supabaseService";'
import_replace = '  marketingService,\n  usersService,\n} from "@/lib/supabaseService";'
if 'usersService' not in content:
    content = content.replace(import_search, import_replace)

# 2. Add usersService to Promise.all in loadData
loadData_search = r'''        agenciesService\.getAll\(\),
        SejourService\.getSejours\(\),
        // Sejour flights mapped to price in SejourService
        supabase\.from\("sejour_flights"\)\.select\("\*"\),'''
loadData_replace = '''        agenciesService.getAll(),
        SejourService.getSejours(),
        usersService.getAll().catch(() => []),
        // Sejour flights mapped to price in SejourService
        supabase.from("sejour_flights").select("*"),'''
if 'usersService.getAll()' not in content:
    content = re.sub(loadData_search, loadData_replace, content)

# 3. Add users to Promise variables
vars_search = r'''        cats,
        agn,
        sejs,
        sejF,
        hr,'''
vars_replace = '''        cats,
        agn,
        sejs,
        allUsers,
        sejF,
        hr,'''
if 'allUsers' not in content:
    content = content.replace(vars_search, vars_replace)

# 4. Add users to setData
setData_search = r'''        categories: Array\.isArray\(cats\) \? cats : \[\],
        agencies: Array\.isArray\(agn\) \? agn : \[\],
        sejours: Array\.isArray\(sejs\) \? sejs : \[\],'''
setData_replace = '''        categories: Array.isArray(cats) ? cats : [],
        agencies: Array.isArray(agn) ? agn : [],
        sejours: Array.isArray(sejs) ? sejs : [],
        users: Array.isArray(allUsers) ? allUsers : [],'''
if 'users: Array.isArray(allUsers)' not in content:
    content = re.sub(setData_search, setData_replace, content)

# 5. Fix Proje logic and Sorumlu
proje_search = r'''    data\.projects\.forEach\(\(p: any\) => \{
      const code = p\.code \|\| p\.reference \|\| p\.proje_adi;
      const firma = p\.company_name \|\| "-";
      const acenteObj = data\.agencies\.find\(\(a:any\) => a\.id === p\.agency_id\);
      const acente = acenteObj\?\.name \|\| p\.agency_name \|\| "-";
      const sd = p\.start_date \|\| p\.created_at;
      const ed = p\.end_date \|\| sd;
      addOp\(sd, ed, "Proje", `Proje: \$\{code\} \| Firma: \$\{firma\} \| Acente: \$\{acente\}`, "bg-blue-500"\);
      // Ekip
      if \(p\.team_members \|\| p\.manager_id\) \{
        const hotel = getHotelName\(p\.hotel_id, "-"\);
        let sorumlular = "Belirtilmemiş";
        if \(Array\.isArray\(p\.team_members\) && p\.team_members\.length > 0\) \{
          sorumlular = p\.team_members\.map\(\(t:any\) => t\.name \|\| t\.full_name \|\| t\.user_name \|\| t\)\.join\(", "\);
        \} else if \(p\.manager_id\) \{
          sorumlular = p\.manager_name \|\| "Sorumlu Atanmış";
        \}
        addOp\(sd, ed, "Ekip", `Ekip: \$\{code\} \| Sorumlu: \$\{sorumlular\} \| Otel: \$\{hotel\} \| Firma: \$\{firma\} \| Acente: \$\{acente\}`, "bg-indigo-500"\);
      \}
    \}\);'''

proje_replace = '''    data.projects.forEach((p: any) => {
      const code = p.code || p.reference || p.proje_adi;
      const firma = p.company_name || "-";
      const acenteObj = data.agencies?.find((a:any) => a.id === p.agency_id);
      const acente = acenteObj?.name || p.agency_name || "-";
      const sd = p.start_date || p.created_at;
      const ed = p.end_date || sd;
      const cIn = new Date(sd).toLocaleDateString("tr-TR");
      const cOut = new Date(ed).toLocaleDateString("tr-TR");
      
      addOp(sd, ed, "Proje", `Proje: ${code} | C-IN: ${cIn} | C-OUT: ${cOut} | Firma: ${firma} | Acente: ${acente}`, "bg-blue-500");
      // Ekip
      if (p.team_members || p.manager_id) {
        const hotel = getHotelName(p.hotel_id, "-");
        let sorumlular = "Belirtilmemiş";
        if (p.manager_id) {
          const userObj = data.users?.find((u:any) => u.id === p.manager_id);
          sorumlular = userObj ? (userObj.full_name || userObj.name || "Sorumlu Atanmış") : "Sorumlu Atanmış";
        }
        addOp(sd, ed, "Ekip", `Ekip: ${code} | Sorumlu: ${sorumlular} | Otel: ${hotel} | Firma: ${firma} | Acente: ${acente}`, "bg-indigo-500");
      }
    });'''
content = re.sub(proje_search, proje_replace, content)

# 6. Fix Sejour logic
sejour_search = r'''    data\.sejours\.forEach\(\(s: any\) => \{
      const hotel = s\.hotels\?\.name \|\| getHotelName\(s\.hotel_id, "-"\);
      const acente = s\.agencies\?\.name \|\| s\.agency_name \|\| "-";
      const sd = s\.check_in_date \|\| s\.created_at;
      const ed = s\.check_out_date \|\| sd;
      addOp\(sd, ed, "Sejour", `Sejour: Voucher: \$\{s\.voucher_number \|\| "-"\} \| Misafir: \$\{s\.customer_name \|\| "-"\} \| Acente: \$\{acente\} \| Otel: \$\{hotel\}`, "bg-emerald-500"\);
    \}\);'''

sejour_replace = '''    data.sejours.forEach((s: any) => {
      const hotel = s.hotelName || s.hotel_name || s.rooms?.[0]?.hotelName || s.hotels?.name || getHotelName(s.hotel_id, "-");
      const acente = s.agencyName || s.agencies?.name || s.agency_name || "-";
      const sd = s.checkInDate || s.check_in_date || s.created_at;
      const ed = s.checkOutDate || s.check_out_date || sd;
      const voucher = s.voucherNumber || s.voucher_number || "-";
      const customer = s.customerName || s.customer_name || "-";
      addOp(sd, ed, "Sejour", `Sejour: Voucher: ${voucher} | Misafir: ${customer} | Acente: ${acente} | Otel: ${hotel}`, "bg-emerald-500");
    });'''
content = re.sub(sejour_search, sejour_replace, content)

# 7. Add Year View logic to Calendar
tile_search = r'''                  tileContent=\{\(\{ date, view \}\) => \{
                    if \(view === 'month'\) \{
                      const dayOps = m\.allOps\.filter\(\(op: any\) => 
                        op\.date\.toDateString\(\) === date\.toDateString\(\) && '''

tile_replace = '''                  tileContent={({ date, view }) => {
                    if (view === 'year') {
                      const monthOps = m.allOps.filter((op: any) => 
                        op.date.getMonth() === date.getMonth() && 
                        op.date.getFullYear() === date.getFullYear() &&
                        (calendarFilter === 'Tümü' || op.category === calendarFilter)
                      );
                      if (monthOps.length > 0) {
                        return (
                          <div className="flex justify-center mt-2">
                            <div className="w-2 h-2 bg-brand-500 rounded-full shadow-sm" title={`${monthOps.length} Operasyon`}></div>
                          </div>
                        );
                      }
                    }
                    if (view === 'month') {
                      const dayOps = m.allOps.filter((op: any) => 
                        op.date.toDateString() === date.toDateString() && '''
content = re.sub(tile_search, tile_replace, content)

with open('frontend/src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

