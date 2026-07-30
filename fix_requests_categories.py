import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# 1. Update imports
if "import { quotesService, quoteItemsService } from \"@/lib/supabaseService\";" in text:
    text = text.replace(
        "import { quotesService, quoteItemsService } from \"@/lib/supabaseService\";",
        "import { quotesService, quoteItemsService, categoriesService } from \"@/lib/supabaseService\";"
    )

# 2. Update categories fetching
old_fetch = """        const catRes = await supabase.from("categories").select("id, name, parent_id").order("name");
        if (catRes.data) setCategories(catRes.data);"""

new_fetch = """        const cats = await categoriesService.getAll();
        if (cats) setCategories(cats);"""

text = text.replace(old_fetch, new_fetch)

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("requests/edit/[id]/page.tsx updated to use categoriesService.getAll()!")
