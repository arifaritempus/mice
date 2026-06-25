const fs = require('fs');

let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add ResponsiveDateRangeField import if missing
if (!pageContent.includes('ResponsiveDateRangeField')) {
  pageContent = pageContent.replace(
    /import \{ supabase \} from "@/lib\/supabase";/,
    `import { supabase } from "@/lib/supabase";\nimport ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";`
  );
}

// 2. Replace Header
const oldHeaderRegex = /<div className="flex flex-wrap items-center justify-between gap-4">([\s\S]*?)<div className="flex-1 overflow-y-auto/m;
const newHeader = `<div className="flex flex-wrap items-center justify-start gap-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">
              Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tüm Departmanların Detaylı Ciro, Hacim ve Operasyon Haritası.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2 p-1 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl w-fit h-[40px]">
              {(
                [
                  { id: "today", label: "Bugün" },
                  { id: "week", label: "Bu Hafta" },
                  { id: "month", label: "Bu Ay" },
                  { id: "year", label: "Bu Yıl" },
                  { id: "all", label: "Tümü" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPeriod(item.id as PeriodFilter);
                    setShowCustomDate(false);
                  }}
                  className={\`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 \${
                    period === item.id
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }\`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setPeriod("custom");
                  setShowCustomDate(true);
                }}
                className={\`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center gap-1 \${
                  period === "custom"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }\`}
              >
                <Calendar size={14} />
                Özel Tarih
              </button>
            </div>

            <AnimatePresence>
              {showCustomDate && (
                  <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-end gap-2"
                >
                  <div className="w-64">
                    <ResponsiveDateRangeField
                      label="Tarih Aralığı"
                      startValue={customDate.start}
                      endValue={customDate.end}
                      onStartChange={(val) =>
                        setCustomDate((prev) => ({ ...prev, start: val }))
                      }
                      onEndChange={(val) =>
                        setCustomDate((prev) => ({ ...prev, end: val }))
                      }
                      onApply={() => loadData()}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={loadData}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ml-1 h-[40px]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative`;

pageContent = pageContent.replace(oldHeaderRegex, newHeader);

// 3. Reorder KPI Cards
const oldCardsRegex = /<KPICard\s*title="Toplam Ciro"[\s\S]*?<KPICard\s*title="Toplam Kâr"[\s\S]*?<KPICard\s*title="MICE \(Proje\) Ciro"[\s\S]*?<KPICard\s*title="Sejour Ciro"[\s\S]*?<KPICard\s*title="Bilet Ciro"[\s\S]*?<\/div>/m;

const newCards = `<KPICard
            title="Toplam Ciro"
            value={m.totalRev}
            isMoney
            icon={Landmark}
            color="emerald"
          />
          <KPICard
            title="Toplam Maliyet"
            value={m.totalCost}
            isMoney
            icon={TrendingDown}
            color="rose"
          />
          <KPICard
            title="MICE (Proje) Ciro"
            value={m.miceRev}
            isMoney
            icon={Briefcase}
            color="blue"
          />
          <KPICard
            title="Sejour Ciro"
            value={m.sejRev}
            isMoney
            icon={Hotel}
            color="cyan"
          />
          <KPICard
            title="Bilet Ciro"
            value={m.flightRev}
            isMoney
            icon={Ticket}
            color="amber"
          />
          <KPICard
            title="Toplam Kâr"
            value={m.totalProfit}
            isMoney
            icon={Award}
            color="fuchsia"
          />
        </div>`;
pageContent = pageContent.replace(oldCardsRegex, newCards);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Patched header and KPI cards");
