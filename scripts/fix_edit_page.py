import re
import os

filepath = "frontend/src/app/sejour/[id]/edit/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Room Interface
if "adultCount?: number;" not in content:
    content = content.replace(
        "currency: string;\n  // Alış maliyeti",
        "currency: string;\n  adultCount?: number;\n  childCount?: number;\n  infantCount?: number;\n  // Alış maliyeti"
    )

# Fix FlightInfo Interface
if "departureAirport?: string;" not in content:
    content = content.replace(
        "route: string;\n  flightNo: string;",
        "route: string;\n  departureAirport?: string;\n  arrivalAirport?: string;\n  flightNo: string;"
    )

# Add missing states if they don't exist
states_to_add = """
  const [roomPriceInput, setRoomPriceInput] = useState<Record<string, string>>({});
  const [servicePriceInput, setServicePriceInput] = useState<Record<string, string>>({});
  const [roomCostInput, setRoomCostInput] = useState<Record<string, string>>({});
  const [serviceCostInput, setServiceCostInput] = useState<Record<string, string>>({});
"""
if "const [roomPriceInput" not in content:
    content = content.replace(
        "const [activeInnerTabs, setActiveInnerTabs] = useState<Record<string, string>>({});",
        "const [activeInnerTabs, setActiveInnerTabs] = useState<Record<string, string>>({});\n" + states_to_add
    )

# Fix salesData initial state
if "creationDate: \"\"" not in content:
    content = content.replace(
        "voucherNumber: \"\",",
        "voucherNumber: \"\",\n    creationDate: \"\",\n    operatorReference: \"\",\n    enteredBy: \"\","
    )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
