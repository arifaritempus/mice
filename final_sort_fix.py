import sys

with open("frontend/src/components/QuoteServiceEditor.tsx", "r") as f:
    text = f.read()

old_sort = """      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.name || "").localeCompare(b.name || "", "tr", {"""

new_sort = """      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.code || a.id || "").toString().localeCompare((b.code || b.id || "").toString(), "tr", {"""

text = text.replace(old_sort, new_sort)

with open("frontend/src/components/QuoteServiceEditor.tsx", "w") as f:
    f.write(text)

print("QuoteServiceEditor fallback sort fixed to match categories page!")
