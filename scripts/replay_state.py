import re

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Room interface
    if "supplierId?: string;" not in content:
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
    
    # Flight interface
    if "departureAirport?: string;" not in content:
        content = content.replace(
            "route: string;\n  flightNo: string;",
            "route: string;\n  departureAirport?: string;\n  arrivalAirport?: string;\n  flightNo: string;"
        )
        
    # ExtraService interface
    if "date?: string;" not in content:
        content = content.replace(
            "serviceType: string;",
            "date?: string;\n  serviceType: string;"
        )
        
    # TransferInfo interface
    if "routeDescription?: string;" not in content:
        content = content.replace(
            "direction: \"arrival\" | \"return\" | \"intermediate\";",
            "direction: \"arrival\" | \"return\" | \"intermediate\";\n  routeDescription?: string;"
        )

    # State Variables
    states = """
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("rooms");
"""
    if "const [isEditingInfo" not in content:
        content = content.replace(
            "const [activeTab, setActiveTab] = useState(\"sales\");",
            "const [activeTab, setActiveTab] = useState(\"sales\");\n" + states
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
