import re

with open("scripts/v6_form_content_fixed.tsx", 'r', encoding='utf-8') as f:
    v6_form = f.read()

replacements = {
    "roomPriceInput": "roomPriceInputV6",
    "setRoomPriceInput": "setRoomPriceInputV6",
    "roomCostInput": "roomCostInputV6",
    "setRoomCostInput": "setRoomCostInputV6",
    "servicePriceInput": "servicePriceInputV6",
    "setServicePriceInput": "setServicePriceInputV6",
    "serviceCostInput": "serviceCostInputV6",
    "setServiceCostInput": "setServiceCostInputV6",
    "parseAmount": "parseAmountV6",
    "formatAmount": "formatAmountV6",
    "expandedSection": "expandedSectionV6",
    "setExpandedSection": "setExpandedSectionV6",
    "isEditingInfo": "isEditingInfoV6",
    "setIsEditingInfo": "setIsEditingInfoV6",
    "activeTab": "activeTabV6",
    "setActiveTab": "setActiveTabV6"
}

for old, new in replacements.items():
    v6_form = v6_form.replace(old, new)

states = """
  // --- V6 INJECTED STATES ---
  const [activeTabV6, setActiveTabV6] = useState("sales");
  const [isEditingInfoV6, setIsEditingInfoV6] = useState(false);
  const [expandedSectionV6, setExpandedSectionV6] = useState<string | null>("rooms");
  const [roomPriceInputV6, setRoomPriceInputV6] = useState<Record<string, string>>({});
  const [roomCostInputV6, setRoomCostInputV6] = useState<Record<string, string>>({});
  const [servicePriceInputV6, setServicePriceInputV6] = useState<Record<string, string>>({});
  const [serviceCostInputV6, setServiceCostInputV6] = useState<Record<string, string>>({});

  const parseAmountV6 = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };
  
  const formatAmountV6 = (val: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  // -------------------------
"""

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add missing interface properties
    if "checkIn?: string;" not in content:
        content = content.replace("hotelId: string;", "hotelId: string;\n  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;")
    if "adultCount?: number;" not in content:
        content = content.replace("currency: string;\n  // Alış", "currency: string;\n  adultCount?: number;\n  childCount?: number;\n  infantCount?: number;\n  // Alış")
    if "accommodationType?: string;" not in content:
        content = content.replace("roomType: string;", "roomType: string;\n  accommodationType?: string;")
    if "departureAirport?: string;" not in content:
        content = content.replace("route: string;\n  flightNo: string;", "route: string;\n  departureAirport?: string;\n  arrivalAirport?: string;\n  flightNo: string;")
    if "date?: string;" not in content:
        content = content.replace("serviceType?: string;", "serviceType?: string;\n  date?: string;")
    if "routeDescription?: string;" not in content:
        content = content.replace("direction: \"arrival\" | \"return\" | \"intermediate\";", "direction: \"arrival\" | \"return\" | \"intermediate\";\n  routeDescription?: string;")

    # Inject states
    start_form_idx = content.find('<form onSubmit={handleSubmit}')
    if start_form_idx != -1:
        return_idx = content.rfind("return (", 0, start_form_idx)
        if return_idx != -1 and "V6 INJECTED STATES" not in content:
            content = content[:return_idx] + states + "\n  " + content[return_idx:]

    # Replace form
    start_form_idx = content.find('<form onSubmit={handleSubmit}')
    end_form_idx = content.find('</form>', start_form_idx) + 7
    if start_form_idx != -1 and end_form_idx != -1:
        content = content[:start_form_idx] + v6_form + content[end_form_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

