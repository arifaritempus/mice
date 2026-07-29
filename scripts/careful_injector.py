import os

with open("scripts/v6_form_content_fixed.tsx", 'r', encoding='utf-8') as f:
    v6_form = f.read()

states_to_inject = """
  // --- INJECTED STATES ---
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
  // -----------------------
"""

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update interfaces
    if "checkIn?: string;" not in content:
        content = content.replace("hotelId: string;", "hotelId: string;\n  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;")
    if "adultCount?: number;" not in content:
        content = content.replace("currency: string;\n  // Alış", "currency: string;\n  adultCount?: number;\n  childCount?: number;\n  infantCount?: number;\n  // Alış")
    if "accommodationType?: string;" not in content:
        content = content.replace("roomType: string;", "roomType: string;\n  accommodationType?: string;")
    if "departureAirport?: string;" not in content:
        content = content.replace("route: string;\n  flightNo: string;", "route: string;\n  departureAirport?: string;\n  arrivalAirport?: string;\n  flightNo: string;")
    if "date?: string;" not in content:
        content = content.replace("serviceType: string;", "date?: string;\n  serviceType: string;")
    if "routeDescription?: string;" not in content:
        content = content.replace("direction: \"arrival\" | \"return\" | \"intermediate\";", "direction: \"arrival\" | \"return\" | \"intermediate\";\n  routeDescription?: string;")

    # 2. Inject states right before the return statement's <form>
    start_form_idx = content.find('<form onSubmit={handleSubmit}')
    if start_form_idx != -1:
        # We need to insert the states right before the return statement inside the component
        # Let's find the nearest "return (" before the form
        return_idx = content.rfind("return (", 0, start_form_idx)
        if return_idx != -1:
            # Check if we already injected
            if "INJECTED STATES" not in content:
                content = content[:return_idx] + states_to_inject + "\n  " + content[return_idx:]

    # 3. Replace the form itself
    start_form_idx = content.find('<form onSubmit={handleSubmit}')
    end_form_idx = content.find('</form>', start_form_idx) + 7
    if start_form_idx != -1 and end_form_idx != -1:
        content = content[:start_form_idx] + v6_form + content[end_form_idx:]

    # 4. Strip redundant states that might be earlier in the file (like activeTab if it existed)
    # The original file had `const [activeTab, setActiveTab] = useState("sales");` somewhere. Let's remove the original one.
    if content.count('const [activeTab, setActiveTab] = useState("sales");') > 1:
        # Replace the first occurrence (which is the original) with an empty string
        content = content.replace('const [activeTab, setActiveTab] = useState("sales");', '', 1)

    # Note: original files also had some fields in the salesData initial state that we need to remove (creationDate, operatorReference, enteredBy)
    # Let's remove them from create/page.tsx
    content = content.replace('creationDate: "",\n    operatorReference: "",\n    enteredBy: "",\n', '')
    content = content.replace('creationDate: "", operatorReference: "", enteredBy: "", ', '')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
