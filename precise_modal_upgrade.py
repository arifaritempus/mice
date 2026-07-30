import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# 1. Imports
if "QuoteServiceEditor" not in text:
    text = text.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";\nimport DateRangeField from "@/components/DateRangeField";\nimport QuoteServiceEditor from "@/components/QuoteServiceEditor";')

# 2. States
old_state = "const [responseLines, setResponseLines] = useState<any[]>([]);"
new_state = """const [responseLines, setResponseLines] = useState<any[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newItem, setNewItem] = useState<any>({
    id: "",
    unit_quantity: 1,
    sefer: 1,
    unit_price: 0,
    currency: "EUR",
    total: 0
  });"""
text = text.replace(old_state, new_state)

# 3. DBL / SNG table parsing (using sub_category since QuoteServiceEditor uses it)
text = text.replace('const dbl = hr.response_details?.prices?.find((p: any) => p.category_id === categories.find((c: any) => c.name.includes("DOUBLE") || c.name.includes("DBL"))?.id);', 
                    'const dbl = hr.response_details?.prices?.find((p: any) => (p.category_id || p.sub_category) === categories.find((c: any) => c.name.includes("DOUBLE") || c.name.includes("DBL"))?.id);')
text = text.replace('const sng = hr.response_details?.prices?.find((p: any) => p.category_id === categories.find((c: any) => c.name.includes("SINGLE") || c.name.includes("SNG"))?.id);', 
                    'const sng = hr.response_details?.prices?.find((p: any) => (p.category_id || p.sub_category) === categories.find((c: any) => c.name.includes("SINGLE") || c.name.includes("SNG"))?.id);')

text = text.replace('return dbl && dbl.price ? dbl.price + " " + dbl.currency : "-";',
                    'return dbl ? (dbl.price || dbl.unit_price) + " " + dbl.currency : "-";')
text = text.replace('return sng && sng.price ? sng.price + " " + sng.currency : "-";',
                    'return sng ? (sng.price || sng.unit_price) + " " + sng.currency : "-";')

# 4. handleSaveResponse payload
# old: prices: responseLines.filter((l: any) => l.category_id && l.price)
# new: prices: responseLines.filter((l: any) => (l.category_id && l.price) || (l.sub_category && l.unit_price))
text = text.replace('prices: responseLines.filter((l: any) => l.category_id && l.price)', 
                    'prices: responseLines.filter((l: any) => (l.category_id && l.price) || (l.sub_category && l.unit_price))')

text = text.replace('const totalAmount = responseLines.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);',
                    'const totalAmount = responseLines.reduce((acc: number, curr: any) => acc + (Number(curr.price) || Number(curr.total) || 0), 0);')

# 5. Empty Pre-fill logic removal
text = text.replace('if (!details.prices || details.prices.length === 0) {\n                             setResponseLines([{ id: Date.now().toString(), category_id: "", price: "", currency: "EUR" }]);\n                          }', '')

# 6. Modal UI Replacement
start_marker = "<div>\n                  <label className=\"block text-xs font-bold text-v3-muted uppercase mb-1\">Tarih Aralığı (C-IN / C-OUT)</label>"
end_marker = "<div className=\"flex gap-3 mt-8\">"

idx_start = text.find(start_marker)
idx_end = text.find(end_marker, idx_start)

if idx_start != -1 and idx_end != -1:
    old_block = text[idx_start:idx_end]
    new_block = """<div className="mt-4">
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Tarih Aralığı (C-IN / C-OUT)</label>
                  <DateRangeField
                    label=""
                    startValue={respCIn}
                    endValue={respCOut}
                    onStartChange={(v) => setRespCIn(v)}
                    onEndChange={(v) => setRespCOut(v)}
                    onApply={(s, e) => {
                      if (s !== undefined) setRespCIn(s);
                      if (e !== undefined) setRespCOut(e);
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-v3-border">
                <QuoteServiceEditor
                  title={<span className="text-sm font-bold text-v3-muted uppercase">Fiyat Kalemleri</span>}
                  items={responseLines}
                  categories={categories}
                  onAdd={() => {
                    setResponseLines([...responseLines, {
                      ...newItem,
                      id: Date.now().toString(),
                      isEditing: true
                    }]);
                  }}
                  onEdit={(item) => {}}
                  onDelete={(id) => {
                    setResponseLines(responseLines.filter(l => l.id !== id));
                  }}
                  onSave={(items) => setResponseLines(items)}
                  showAddRow={showAddRow}
                  setShowAddRow={setShowAddRow}
                  newItem={newItem}
                  setNewItem={setNewItem}
                />
              </div>
            </div>
            
            """
    text = text.replace(old_block, new_block)

# 7. Make modal wider
text = text.replace("w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto", "w-full max-w-[95vw] lg:max-w-6xl m-4 max-h-[90vh] overflow-y-auto")

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Modal precisely upgraded!")
