import re

files = ["frontend/src/app/requests/create/page.tsx", "frontend/src/app/requests/edit/[id]/page.tsx"]

for filepath in files:
    with open(filepath, "r") as f:
        text = f.read()
    
    # 1. Add state
    if "const [barNight, setBarNight]" not in text:
        text = text.replace("const [gala, setGala] = useState({ requested: false, date: \"\", notes: \"\" });", 
                            "const [gala, setGala] = useState({ requested: false, date: \"\", notes: \"\" });\n  const [barNight, setBarNight] = useState({ requested: false, date: \"\", notes: \"\" });")

    # 2. Add to handleSave update/insert payload
    if "bar_night: { requested: barNight.requested, date: barNight.date || null, notes: barNight.notes }" not in text:
        text = text.replace("cocktail: { requested: cocktail.requested, date: cocktail.date || null, notes: cocktail.notes },",
                            "cocktail: { requested: cocktail.requested, date: cocktail.date || null, notes: cocktail.notes },\n          bar_night: { requested: barNight.requested, date: barNight.date || null, notes: barNight.notes },")

    # 3. Add to fetchRequest in Edit page (only if it exists)
    if "if (data.bar_night) setBarNight" not in text and "fetchRequest" in text:
        text = text.replace("if (data.cocktail) setCocktail", 
                            "if (data.cocktail) setCocktail({ requested: data.cocktail.requested, date: data.cocktail.date?.split('T')[0] || \"\", notes: data.cocktail.notes || \"\" });\n          if (data.bar_night) setBarNight({ requested: data.bar_night.requested, date: data.bar_night.date?.split('T')[0] || \"\", notes: data.bar_night.notes || \"\" });\n          // REMOVE THIS")
        # cleanup the extra cocktail if my replace hit
        text = text.replace("          // REMOVE THIS({ requested: data.cocktail.requested, date: data.cocktail.date?.split('T')[0] || \"\", notes: data.cocktail.notes || \"\" });", "")
        # to be safe, I'll use regex for fetchRequest injection
        text = re.sub(r'(if \(data\.cocktail\).*?;)', r'\1\n          if (data.bar_night) setBarNight({ requested: data.bar_night.requested, date: data.bar_night.date?.split("T")[0] || "", notes: data.bar_night.notes || "" });', text)


    # 4. Add UI element between cocktail and gala
    ui_block = """                  {/* BAR NIGHT */}
                  <div className={`p-4 rounded-xl border transition-colors ${barNight.requested ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-v3-bg border-v3-border hover:bg-v3-surface'}`}>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input type="checkbox" checked={barNight.requested} onChange={(e) => setBarNight({...barNight, requested: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white" />
                      <span className="text-sm font-semibold text-v3-text">Bar Gecesi İsteniyor</span>
                    </label>
                    {barNight.requested && (
                      <div className="mt-4 pl-8 grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                          <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Opsiyonel Tarih</label>
                          <input type="date" value={barNight.date} onChange={(e) => setBarNight({...barNight, date: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">Not / Konsept</label>
                          <textarea rows={2} value={barNight.notes} onChange={(e) => setBarNight({...barNight, notes: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-4 py-2.5 text-sm resize-none" placeholder="Limitsiz yerli/yabancı, DJ performansı vb..." />
                        </div>
                      </div>
                    )}
                  </div>"""

    if "Bar Gecesi İsteniyor" not in text:
        text = text.replace("{/* GALA YEMEĞİ */}", ui_block + "\n\n                  {/* GALA YEMEĞİ */}")

    with open(filepath, "w") as f:
        f.write(text)

print("Bar Gecesi added!")
