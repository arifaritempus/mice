import re

# 1. Fix v6_form_content.tsx
with open("scripts/v6_form_content.tsx", 'r', encoding='utf-8') as f:
    v6_content = f.read()

transfer_start = v6_content.find("sejourData.transfers.map((transfer")
service_start = v6_content.find("sejourData.extraServices.map((service")
end_idx = v6_content.find("Tahsilat Sekmesi")
if transfer_start != -1 and service_start != -1:
    transfer_block = v6_content[transfer_start:service_start]
    transfer_block = transfer_block.replace("room.price", "transfer.price").replace("room.currency", "transfer.currency")
    
    service_block = v6_content[service_start:end_idx]
    service_block = service_block.replace("room.price", "service.price").replace("room.currency", "service.currency")
    
    v6_content = v6_content[:transfer_start] + transfer_block + service_block + v6_content[end_idx:]

with open("scripts/v6_form_content_fixed.tsx", 'w', encoding='utf-8') as f:
    f.write(v6_content)

# 2. Inject into files
states = """
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

    # Interfaces
    if "checkIn?: string;" not in content:
        content = content.replace(
            "hotelId: string;",
            "hotelId: string;\n  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;"
        )
    if "adultCount?: number;" not in content:
        content = content.replace(
            "currency: string;\n  // Alış",
            "currency: string;\n  adultCount?: number;\n  childCount?: number;\n  infantCount?: number;\n  // Alış"
        )
    if "accommodationType?: string;" not in content:
        content = content.replace(
            "roomType: string;",
            "roomType: string;\n  accommodationType?: string;"
        )
    if "departureAirport?: string;" not in content:
        content = content.replace(
            "route: string;\n  flightNo: string;",
            "route: string;\n  departureAirport?: string;\n  arrivalAirport?: string;\n  flightNo: string;"
        )
    if "date?: string;" not in content:
        content = content.replace(
            "serviceType: string;",
            "date?: string;\n  serviceType: string;"
        )
    if "routeDescription?: string;" not in content:
        content = content.replace(
            "direction: \"arrival\" | \"return\" | \"intermediate\";",
            "direction: \"arrival\" | \"return\" | \"intermediate\";\n  routeDescription?: string;"
        )

    # State variables replace old ones
    # We replace everything from `const [activeTab` up to `const handleSubmit =`
    start_tab = content.find('const [activeTab')
    end_handle = content.find('const handleSubmit =')
    if start_tab != -1 and end_handle != -1:
        content = content[:start_tab] + states + "\n  " + content[end_handle:]
    
    # Also strip stray formatAmount if they somehow are outside that block
    if "const formatAmount =" in content[end_handle:]:
        # Remove any other parseAmount/formatAmount later in the file
        pass # Actually the regex I used earlier broke things, so let's just rely on the block replacement.
        # But wait, in the original files, roomCostInput and roomPriceInput were defined deep down!
        # Because we're starting from v4, they were deep down.
        content = re.sub(r'const \[roomPriceInput.*?\n', '', content)
        content = re.sub(r'const \[roomCostInput.*?\n', '', content)
        content = re.sub(r'const \[servicePriceInput.*?\n', '', content)
        content = re.sub(r'const \[serviceCostInput.*?\n', '', content)
        # And formatAmount/parseAmount might be duplicated? In v4 they were in the middle of the file.
        content = re.sub(r'const parseAmount = \(val: string\) => \{\n.*?return parseFloat\(clean\) \|\| 0;\n\s*};\n', '', content, flags=re.DOTALL)
        content = re.sub(r'const formatAmount = \(val: number\) => \{\n.*?return val\.toLocaleString.*?;\n\s*};\n', '', content, flags=re.DOTALL)


    # Form replace
    start_idx = content.find('<form onSubmit={handleSubmit}')
    end_idx = content.find('</form>', start_idx) + 7
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + v6_content + content[end_idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
