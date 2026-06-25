import re

with open('frontend/src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Chunk 1
state_search = r'  const \[calendarFilter, setCalendarFilter\] = useState\("Tümü"\);\n'
state_replace = '''  const [calendarFilter, setCalendarFilter] = useState("Tümü");

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<"month"|"year"|"decade"|"century">("month");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCalendarDate(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const now = new Date();
    if (period === "thisMonth") {
      setCalendarViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
      setCalendarViewMode("month");
    } else if (period === "lastMonth") {
      setCalendarViewDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      setCalendarViewMode("month");
    } else if (period === "thisYear" || period === "year") {
      setCalendarViewDate(new Date(now.getFullYear(), 0, 1));
      setCalendarViewMode("year");
    } else if (period === "lastYear") {
      setCalendarViewDate(new Date(now.getFullYear() - 1, 0, 1));
      setCalendarViewMode("year");
    } else if (period === "all" || period === "allTime") {
      setCalendarViewMode("year");
    }
  }, [period]);

'''
content = re.sub(state_search, state_replace, content)

# Chunk 2
projects_search = r'''    data\.projects\.forEach\(\(p: any\) => \{
      const code = p\.code \|\| p\.reference \|\| p\.proje_adi;
      const firma = p\.company_name \|\| "-";
      const acente = p\.agency_name \|\| "-";
      const sd = p\.start_date \|\| p\.created_at;
      const ed = p\.end_date \|\| sd;
      addOp\(sd, ed, "Proje", `Proje: \$\{code\} \| Firma: \$\{firma\} \| Acente: \$\{acente\}`, "bg-blue-500"\);
      // Ekip
      if \(p\.team_members \|\| p\.manager_id\) \{
        const hotel = getHotelName\(p\.hotel_id, "-"\);
        let sorumlular = p\.manager_name \|\| "Belirtilmemiş";
        if \(Array\.isArray\(p\.team_members\) && p\.team_members\.length > 0\) \{
          sorumlular = p\.team_members\.map\(\(t:any\) => t\.name \|\| t\.user_name \|\| t\)\.join\(", "\);
        \}
        addOp\(sd, ed, "Ekip", `Ekip: \$\{code\} \| Sorumlu: \$\{sorumlular\} \| Otel: \$\{hotel\} \| Firma: \$\{firma\} \| Acente: \$\{acente\}`, "bg-indigo-500"\);
      \}
    \}\);'''

projects_replace = '''    data.projects.forEach((p: any) => {
      const code = p.code || p.reference || p.proje_adi;
      const firma = p.company_name || "-";
      const acenteObj = data.agencies.find((a:any) => a.id === p.agency_id);
      const acente = acenteObj?.name || p.agency_name || "-";
      const sd = p.start_date || p.created_at;
      const ed = p.end_date || sd;
      addOp(sd, ed, "Proje", `Proje: ${code} | Firma: ${firma} | Acente: ${acente}`, "bg-blue-500");
      // Ekip
      if (p.team_members || p.manager_id) {
        const hotel = getHotelName(p.hotel_id, "-");
        let sorumlular = "Belirtilmemiş";
        if (Array.isArray(p.team_members) && p.team_members.length > 0) {
          sorumlular = p.team_members.map((t:any) => t.name || t.full_name || t.user_name || t).join(", ");
        } else if (p.manager_id) {
          sorumlular = "Sorumlu Atanmış";
        }
        addOp(sd, ed, "Ekip", `Ekip: ${code} | Sorumlu: ${sorumlular} | Otel: ${hotel} | Firma: ${firma} | Acente: ${acente}`, "bg-indigo-500");
      }
    });'''
content = content.replace(projects_search, projects_replace)
if projects_search not in f.read() and projects_replace not in content:
    content = re.sub(projects_search, projects_replace, content) # Try regex if exact match fails

# Chunk 3
calendar_search = r'<CalendarComponent\s+className="dashboard-calendar w-full border-none shadow-sm rounded-xl p-2 bg-white/50 backdrop-blur-sm"'
calendar_replace = '''<CalendarComponent
                  className="dashboard-calendar w-full border-none shadow-sm rounded-xl p-2 bg-white/50 backdrop-blur-sm"
                  view={calendarViewMode}
                  onViewChange={({ view }) => setCalendarViewMode(view as any)}
                  activeStartDate={calendarViewDate}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    if (activeStartDate) setCalendarViewDate(activeStartDate);
                  }}
                  onClickDay={(value) => setSelectedCalendarDate(value)}'''
content = re.sub(calendar_search, calendar_replace, content)

# Chunk 4
end_search = r'''              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  \);
\}'''

end_replace = '''              </div>
            </GlassCard>
          </div>
        </div>
      </div>
      
      {/* Detay Modalı */}
      <AnimatePresence>
        {selectedCalendarDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCalendarDate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  {selectedCalendarDate.toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {(() => {
                  const ops = m.allOps.filter((op:any) => op.date.toDateString() === selectedCalendarDate.toDateString());
                  if (ops.length === 0) {
                    return <div className="text-center text-slate-500 py-8">Bu tarihte herhangi bir operasyon kaydı bulunmuyor.</div>;
                  }
                  
                  const filteredOps = calendarFilter === "Tümü" ? ops : ops.filter((op: any) => op.type === calendarFilter);
                  
                  if (filteredOps.length === 0) {
                    return <div className="text-center text-slate-500 py-8">Seçili filtreye uygun kayıt bulunmuyor.</div>;
                  }

                  return filteredOps.map((op: any, i: number) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}>
                      <div className={`w-2 rounded-full ${op.color}`} />
                      <div className="flex-1">
                        <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: op.color.replace('bg-', 'var(--').replace('-500', '-600)') }}>
                          {op.type}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {op.title.split(' | ').map((part:string, idx:number) => (
                            <div key={idx} className="mb-0.5">
                              {part}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}'''
content = re.sub(end_search, end_replace, content)

with open('frontend/src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
