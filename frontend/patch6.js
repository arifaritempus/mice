const fs = require('fs');

let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Custom Tooltip rewrite
const oldTooltipRegex = /const CustomTooltip = \(\{ active, payload, label \}: any\) => \{[\s\S]*?return null;\n\};/;
const newTooltip = `const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Check if data is an object with our custom fields (Ciro, Maliyet, Kar/Zarar, Marj vb.)
    // If it has them, render all relevant fields.
    // Otherwise fallback to default payload.map
    
    // Check for our custom fields (from hotelData, agencyData, projectEfficiencyData, sejourEfficiencyData)
    if (data && ('Ciro' in data || 'Satış' in data || 'Maliyet' in data || 'Kar/Zarar' in data || 'Adet' in data)) {
      const formatMoneySafe = (val: any) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val || 0);
      return (
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 relative min-w-[150px]">
          <p className="text-white font-bold mb-2 pb-2 border-b border-white/10">{label}</p>
          {('Ciro' in data) && <p className="text-emerald-400 text-[11px] flex justify-between gap-4 font-mono"><span>Ciro:</span> <span>{formatMoneySafe(data['Ciro'])}</span></p>}
          {('Satış' in data) && <p className="text-emerald-400 text-[11px] flex justify-between gap-4 font-mono"><span>Satış:</span> <span>{formatMoneySafe(data['Satış'])}</span></p>}
          {('Maliyet' in data) && <p className="text-rose-400 text-[11px] flex justify-between gap-4 font-mono"><span>Maliyet:</span> <span>{formatMoneySafe(data['Maliyet'])}</span></p>}
          {('Kar/Zarar' in data) && <p className={\`text-[11px] flex justify-between gap-4 font-mono \${(data['Kar/Zarar'] || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}><span>Kar/Zarar:</span> <span>{formatMoneySafe(data['Kar/Zarar'])}</span></p>}
          {('Marj' in data) && <p className="text-amber-400 text-[11px] flex justify-between gap-4 font-mono"><span>Marj:</span> <span>%{data['Marj']}</span></p>}
          {('Adet' in data) && <p className="text-cyan-400 text-[11px] flex justify-between gap-4 font-mono"><span>Adet:</span> <span>{data['Adet']}</span></p>}
          {('value' in data && !('Ciro' in data) && !('Adet' in data)) && <p className="text-white text-[11px] flex justify-between gap-4 font-mono"><span>Değer:</span> <span>{data['value']}</span></p>}
        </div>
      );
    }

    return (
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 relative">
        <p className="text-white font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const isMoney =
            [
              "Tahsilat",
              "Ödeme",
              "Ciro",
              "Kâr",
              "Maliyet",
              "Satis",
              "Satış",
              "Kar/Zarar",
              "Hacim",
              "Tutar",
            ].includes(entry.name) || String(entry.name).includes("TRY");
          return (
            <p key={index} className="text-sm flex items-center gap-2 font-mono">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-slate-300">{entry.name}:</span>
              <span className="text-white font-bold">
                {isMoney ? formatMoney(entry.value) : formatInt(entry.value)}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};`;
pageContent = pageContent.replace(oldTooltipRegex, newTooltip);

// Fix "Bilinmeyen Acente" and "Bilinmeyen Otel" logic
pageContent = pageContent.replace(
  /const getAgencyName = \(id: string\) => \{[\s\S]*?return found \? found\.name : "Bilinmeyen Acente";\n    \};/,
  `const getAgencyName = (id: string, fallback?: string) => {
      const found = data.agencies.find((a: any) => a.id === id);
      return found ? found.name : (fallback || "Bilinmeyen Acente");
    };`
);

pageContent = pageContent.replace(
  /const getHotelName = \(id: string, fallback: string\) => \{[\s\S]*?return found \? found\.name : fallback;\n    \};/,
  `const getHotelName = (id: string, fallback: string) => {
      const found = data.hotels.find((h: any) => h.id === id);
      return found ? found.name : fallback;
    };`
);

// We need to inject the proper names into agencyData and hotelData.
// Currently agencyData uses getAgencyName(a.agency_id) which returns fallback if id missing.
// I will rewrite the useMemo lines for agencyData and hotelData!

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Custom Tooltip and getNames replaced");
