import re

with open("frontend/src/components/QuoteServiceEditor.tsx", "r") as f:
    content = f.read()

# Remove activeCategoryId state
content = content.replace('const [activeCategoryId, setActiveCategoryId] = useState<string>("all");\n', '')

# Remove Category Tabs UI
# We need to find the specific block starting with {/* Kategori Sekmeleri
import re
pattern = r'\{\/\* Kategori Sekmeleri.*?</div>\s*</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Revert the filter mapping
content = content.replace(
    'items.filter(item => activeCategoryId === "all" || item.main_category === activeCategoryId).map((item, index) => (',
    'items.map((item, index) => ('
)

with open("frontend/src/components/QuoteServiceEditor.tsx", "w") as f:
    f.write(content)

print("Reverted QuoteServiceEditor categories!")
