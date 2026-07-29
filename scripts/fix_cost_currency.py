import re

def fix_edit_page():
    path = "frontend/src/app/sejour/[id]/edit/page.tsx"
    with open(path, "r") as f:
        content = f.read()

    # Map the arrays when loading data to include costCurrency: "TRY"
    content = content.replace(
        "setRooms(sejour.rooms);", 
        "setRooms(sejour.rooms.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));"
    )
    content = content.replace(
        "setFlights(sejour.flights);", 
        "setFlights(sejour.flights.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));"
    )
    content = content.replace(
        "setTransfers(sejour.transfers);", 
        "setTransfers(sejour.transfers.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));"
    )
    content = content.replace(
        "setExtraServices(sejour.extraServices);", 
        "setExtraServices(sejour.extraServices.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));"
    )

    with open(path, "w") as f:
        f.write(content)

def fix_create_page():
    path = "frontend/src/app/sejour/create/page.tsx"
    with open(path, "r") as f:
        content = f.read()

    # We want to add costCurrency: "TRY" to addRoom, addFlight, addTransfer, addExtraService if missing
    # They usually have: currency: "TRY",
    # but we don't want to touch collection or salesData.
    # Fortunately, we can just replace specific chunks.
    
    # 1. Flight
    content = content.replace(
        'totalPrice: 0,\n      currency: "TRY",\n      flightDate:',
        'totalPrice: 0,\n      currency: "TRY",\n      costCurrency: "TRY",\n      flightDate:'
    )
    
    # 2. Transfer
    content = content.replace(
        'price: 0,\n      currency: "TRY",\n      date:',
        'price: 0,\n      currency: "TRY",\n      costCurrency: "TRY",\n      date:'
    )
    
    # 3. Extra Service
    content = content.replace(
        'price: 0,\n      currency: "TRY",\n    };\n    setExtraServices',
        'price: 0,\n      currency: "TRY",\n      costCurrency: "TRY",\n    };\n    setExtraServices'
    )
    
    with open(path, "w") as f:
        f.write(content)

fix_edit_page()
fix_create_page()
