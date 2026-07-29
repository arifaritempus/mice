import re

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Strip existing duplicates
    content = re.sub(r'const \[roomPriceInput.*?\n', '', content)
    content = re.sub(r'const \[roomCostInput.*?\n', '', content)
    content = re.sub(r'const \[servicePriceInput.*?\n', '', content)
    content = re.sub(r'const \[serviceCostInput.*?\n', '', content)
    content = re.sub(r'const \[isEditingInfo.*?\n', '', content)
    content = re.sub(r'const \[expandedSection.*?\n', '', content)
    
    # Strip parseAmount and formatAmount
    content = re.sub(r'const parseAmount = \(val: string\) => \{.*?\}\s*;\n', '', content, flags=re.DOTALL)
    content = re.sub(r'const formatAmount = \(val: number\) => \{.*?\}\s*;\n', '', content, flags=re.DOTALL)

    # Inject once
    states = """
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
    content = content.replace("const [activeTab, setActiveTab] = useState(\"sales\");", "const [activeTab, setActiveTab] = useState(\"sales\");\n" + states)

    # Fix interface for ExtraService if missing date
    if "date?: string;" not in content:
        content = content.replace("serviceType: string;", "date?: string;\n  serviceType: string;")
        
    # Fix Room if missing checkIn
    if "checkIn?: string;" not in content:
        content = content.replace("hotelId: string;", "hotelId: string;\n  checkIn?: string;\n  checkOut?: string;\n  supplierId?: string;")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
