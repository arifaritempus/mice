import sys

# --- FIX 1: QuoteServiceEditor.tsx ---
with open("frontend/src/components/QuoteServiceEditor.tsx", "r") as f:
    text = f.read()

old_select_logic = """                {categories
                  .filter((c) => !c.parent_id)
                  .sort((a, b) => {
                    // /categories sayfasındaki sıralama ile aynı: code veya name'e göre
                    const aKey = (a.code || a.name || "").toString();
                    const bKey = (b.code || b.name || "").toString();
                    return aKey.localeCompare(bKey, "tr", {
                      numeric: true,
                      sensitivity: "base",
                    });
                  })
                  .map((c) => ("""

new_select_logic = """                {mainCategories.map((c) => ("""

text = text.replace(old_select_logic, new_select_logic)

with open("frontend/src/components/QuoteServiceEditor.tsx", "w") as f:
    f.write(text)


# --- FIX 2: frontend/src/app/requests/edit/[id]/page.tsx ---
with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text2 = f.read()

old_ref_logic = """      const date = new Date();
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const reference = `MICE-${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}-${randomPart}`;"""

new_ref_logic = """      const date = new Date();
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const quoteReference = reference || `MICE-${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}-${randomPart}`;"""

text2 = text2.replace(old_ref_logic, new_ref_logic)
text2 = text2.replace("reference,\n        agency_id:", "reference: quoteReference,\n        agency_id:")
text2 = text2.replace("reference: createdQuote.reference,", "reference: createdQuote.reference,") # no change needed here actually since createdQuote.reference is fine.

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text2)

print("Both fixes applied!")
