import re

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The states to inject
    states = """
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

    if "const [roomPriceInput" not in content:
        content = content.replace(
            "const [expandedSection, setExpandedSection] = useState<string | null>(\"rooms\");",
            "const [expandedSection, setExpandedSection] = useState<string | null>(\"rooms\");\n" + states
        )
    
    # Fix the wrong variable names inside transfer and service mapping
    # 1. Inside Transfer mapping, change room.price to transfer.price and room.currency to transfer.currency
    # We can isolate the transfer section by looking for "sejourData.transfers.map((transfer"
    transfer_start = content.find("sejourData.transfers.map((transfer")
    service_start = content.find("sejourData.extraServices.map((service")
    end_idx = content.find("Tahsilat Sekmesi")
    
    if transfer_start != -1 and service_start != -1:
        transfer_block = content[transfer_start:service_start]
        transfer_block = transfer_block.replace("room.price", "transfer.price").replace("room.currency", "transfer.currency")
        
        service_block = content[service_start:end_idx]
        service_block = service_block.replace("room.price", "service.price").replace("room.currency", "service.currency")
        
        content = content[:transfer_start] + transfer_block + service_block + content[end_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
