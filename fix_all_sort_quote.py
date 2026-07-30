import sys

with open("frontend/src/components/QuoteServiceEditor.tsx", "r") as f:
    text = f.read()

# The sorting helper functions
sorting_helpers = """
  const isUuid = (value?: string) =>
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  const getCategorySortKey = (category: any) => {
    const code = (category.code || "").toString().trim();
    if (code) return code;
    const id = (category.id || "").toString().trim();
    if (id && !isUuid(id)) return id;
    return (category.name || "").toString().trim();
  };

  const getCategorySortWeight = (category: any) => {
    const key = getCategorySortKey(category);
    const nums = key.match(/\d+/g);
    if (!nums) return Number.MAX_SAFE_INTEGER;
    const weight = Number(nums.join(""));
    return Number.isFinite(weight) ? weight : Number.MAX_SAFE_INTEGER;
  };

  const compareByCategoryId = (a: any, b: any) => {
    const aOrder = a.sort_order ?? 9999;
    const bOrder = b.sort_order ?? 9999;
    if (aOrder !== bOrder) return aOrder - bOrder;

    const wa = getCategorySortWeight(a);
    const wb = getCategorySortWeight(b);
    if (wa !== wb) return wa - wb;
    return getCategorySortKey(a).localeCompare(getCategorySortKey(b), "tr", {
      numeric: true,
      sensitivity: "base",
    });
  };
"""

# Insert sorting helpers right after "const [showCategoryModal, setShowCategoryModal] = useState(false);"
marker = "const [showCategoryModal, setShowCategoryModal] = useState(false);"
if "const compareByCategoryId" not in text:
    text = text.replace(marker, marker + "\n" + sorting_helpers)

# Replace mainCategories sorting logic
old_main_sort = """      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.code || a.id || "").toString().localeCompare((b.code || b.id || "").toString(), "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });"""
new_main_sort = "      .sort(compareByCategoryId);"
text = text.replace(old_main_sort, new_main_sort)

# Replace subCategories sorting logic inside subCategoriesByMain useMemo
old_sub_sort = """          subCats.sort((a, b) => {
            const aKey = (a.code || a.name || "").toString();
            const bKey = (b.code || b.name || "").toString();
            return aKey.localeCompare(bKey, "tr", {
              numeric: true,
              sensitivity: "base",
            });
          });"""
new_sub_sort = "          subCats.sort(compareByCategoryId);"
text = text.replace(old_sub_sort, new_sub_sort)


with open("frontend/src/components/QuoteServiceEditor.tsx", "w") as f:
    f.write(text)

print("Exact sorting logic copied to QuoteServiceEditor!")
