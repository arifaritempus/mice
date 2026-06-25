const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Pazarlama Hunisi Empty State & marketingService
pageContent = pageContent.replace(
  /const fMkt = data\.marketing;\n\s*const targetAudience = data\.marketing\.length;/m,
  `const fMkt = data.marketing;
    const targetAudience = data.marketing.length || 1; // Prevent empty funnel`
);
// Fix Recharts Funnel empty state by rendering an Empty message if all 0
pageContent = pageContent.replace(
  /<FunnelChart>([\s\S]*?)<\/FunnelChart>/m,
  `{m.funnelData.reduce((a:number, b:any) => a + (b.value||0), 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                      <AlertCircle size={32} className="text-violet-500 mb-2" />
                      <span className="text-xs font-bold text-center">Henüz Pazarlama Verisi Yok</span>
                    </div>
                  ) : (
                  <FunnelChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Funnel
                      dataKey="value"
                      data={m.funnelData}
                      isAnimationActive
                    >
                      <LabelList
                        position="right"
                        fill="#fff"
                        stroke="none"
                        dataKey="name"
                        fontSize={11}
                      />
                    </Funnel>
                  </FunnelChart>)}`
);

// 2. Re-arrange KPI Cards to make sure Toplam Kar is 6th
const kpiCardsRegex = /<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 relative z-10">([\s\S]*?)<\/div>\n\n\s*\{\/\* ROW 2/m;
const newKpiCards = `<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 relative z-10">
          <KPICard title="Toplam Ciro" value={m.totalRev} isMoney icon={Landmark} color="emerald" />
          <KPICard title="Toplam Maliyet" value={m.totalCost} isMoney icon={TrendingDown} color="rose" />
          <KPICard title="MICE (Proje) Ciro" value={m.miceRev} isMoney icon={Briefcase} color="blue" />
          <KPICard title="Sejour (Otel) Ciro" value={m.sejRev} isMoney icon={Hotel} color="cyan" />
          <KPICard title="Bilet Ciro" value={m.flightRev} isMoney icon={Ticket} color="amber" />
          <KPICard title="Toplam Kâr" value={m.totalProfit} isMoney icon={Award} color="fuchsia" />
        </div>

        {/* ROW 2`;
pageContent = pageContent.replace(kpiCardsRegex, newKpiCards);

// 3. Calendar View for Yaklaşan Operasyonel Akış
// Replace the list view with a simple calendar view
const opsListRegex = /<div className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-\[220px\]">([\s\S]*?)<\/GlassCard>/m;
const opsCalendarCode = `<div className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-[400px]">
                {m.topOps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                    <span className="text-xs font-bold">
                      Yaklaşan operasyon kaydı bulunamadı.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {/* Calendar View Custom implementation */}
                    {Array.from({length: 30}).map((_, idx) => {
                      const d = new Date();
                      d.setDate(d.getDate() + idx);
                      const dayOps = m.topOps.filter((op: any) => op.date.toDateString() === d.toDateString());
                      
                      if (dayOps.length === 0 && idx > 14) return null; // only show empty days for first 2 weeks to save space
                      
                      return (
                        <div key={idx} className={\`p-2 rounded-xl border \${dayOps.length > 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-50'} min-h-[80px] flex flex-col\`}>
                          <div className="text-[10px] font-bold text-slate-400 mb-2 border-b border-white/10 pb-1">
                            {d.toLocaleDateString("tr-TR", { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                            {dayOps.map((op: any, i: number) => (
                              <div key={i} className={\`text-[9px] p-1 rounded font-bold truncate \${
                                op.type === "Uçuş" ? "bg-amber-500/20 text-amber-400" :
                                op.type === "Transfer" ? "bg-fuchsia-500/20 text-fuchsia-400" :
                                "bg-cyan-500/20 text-cyan-400"
                              }\`} title={\`\${op.type} | \${op.title} | \${op.detail}\`}>
                                {op.type === "Uçuş" ? <Plane size={10} className="inline mr-1"/> : op.type === "Transfer" ? <Bus size={10} className="inline mr-1"/> : <Hotel size={10} className="inline mr-1"/>}
                                {op.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </GlassCard>`;

pageContent = pageContent.replace(opsListRegex, opsCalendarCode);

// Write changes
fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Applied final fixes to dashboard layout and logic.");
