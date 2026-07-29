import os

def find_lines(filepath):
    print(f"--- {filepath} ---")
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if 'const [activeTab, setActiveTab] = useState("sales");' in line:
            print(f"Tabs State: {i}")
        if '          {/* Main Navigation Tabs */}' in line:
            print(f"Tabs UI Start: {i}")
        if '                    Satış Bilgileri' in line:
            print(f"Satış Bilgileri Title: {i}")
        if '{/* Accommodation Section */}' in line:
            print(f"Accommodation Section: {i}")
        if '{showAccommodation && (' in line:
            print(f"showAccommodation ({len(line) - len(line.lstrip())} spaces): {i}")
        if '{showFlight && (' in line:
            print(f"showFlight ({len(line) - len(line.lstrip())} spaces): {i}")
        if '{showTransfer && (' in line:
            print(f"showTransfer ({len(line) - len(line.lstrip())} spaces): {i}")
        if '{showExtraServices && (' in line:
            print(f"showExtraServices ({len(line) - len(line.lstrip())} spaces): {i}")
        if '{/* Purchase Tab */}' in line:
            print(f"Purchase Tab: {i}")

find_lines("frontend/src/app/sejour/create/page.tsx")
find_lines("frontend/src/app/sejour/[id]/edit/page.tsx")
