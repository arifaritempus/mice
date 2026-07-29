import re
import os

with open("scripts/v6_form_content.tsx", 'r', encoding='utf-8') as f:
    new_form = f.read()

# Make sure new_form doesn't have `room.price` inside transfer or extra services blocks
# We fix this inside the string directly
transfer_start = new_form.find("sejourData.transfers.map((transfer")
service_start = new_form.find("sejourData.extraServices.map((service")
end_idx = new_form.find("Tahsilat Sekmesi")
if transfer_start != -1 and service_start != -1:
    transfer_block = new_form[transfer_start:service_start]
    transfer_block = transfer_block.replace("room.price", "transfer.price").replace("room.currency", "transfer.currency")
    
    service_block = new_form[service_start:end_idx]
    service_block = service_block.replace("room.price", "service.price").replace("room.currency", "service.currency")
    
    new_form = new_form[:transfer_start] + transfer_block + service_block + new_form[end_idx:]

states_block = """
  const [activeTab, setActiveTab] = useState("sales");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("rooms");
  const [roomPriceInput, setRoomPriceInput] = useState<Record<string, string>>({});
  const [roomCostInput, setRoomCostInput] = useState<Record<string, string>>({});
  const [servicePriceInput, setServicePriceInput] = useState<Record<string, string>>({});
  const [serviceCostInput, setServiceCostInput] = useState<Record<string, string>>({});

  const parseAmount = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };
  
  const formatAmount = (val: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
"""

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Strip existing states from the file
    content = re.sub(r'const \[activeTab.*?useState\("sales"\);\n', '', content)
    content = re.sub(r'const \[isEditingInfo.*?\n', '', content)
    content = re.sub(r'const \[expandedSection.*?\n', '', content)
    content = re.sub(r'const \[roomPriceInput.*?\n', '', content)
    content = re.sub(r'const \[roomCostInput.*?\n', '', content)
    content = re.sub(r'const \[servicePriceInput.*?\n', '', content)
    content = re.sub(r'const \[serviceCostInput.*?\n', '', content)
    content = re.sub(r'const parseAmount = \(val: string\) => \{[\s\S]*?\}\s*;\n', '', content)
    content = re.sub(r'const formatAmount = \(val: number\) => \{[\s\S]*?\}\s*;\n', '', content)

    # Re-inject them right before handleSubmit
    # In create/page.tsx, it's `const handleSubmit = async`
    # In edit/page.tsx, it's `const handleSubmit = async`
    # Let's inject it right after `const router = useRouter();` or `const [error, setError] = ...`
    # The safest anchor is `const handleSubmit = `
    
    parts = content.split("const handleSubmit = ")
    if len(parts) == 2:
        content = parts[0] + states_block + "\n  const handleSubmit = " + parts[1]

    # Replace form
    start_idx = content.find('<form onSubmit={handleSubmit}')
    end_idx = content.find('</form>', start_idx) + 7
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + new_form + content[end_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
