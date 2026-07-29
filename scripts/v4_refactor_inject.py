import re
import os

filepath = "frontend/src/app/sejour/create/page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

with open("scripts/new_form_content_create.tsx", 'r', encoding='utf-8') as f:
    new_form = f.read()

# 1. Replace the form
start_idx = content.find('<form onSubmit={handleSubmit}')
end_idx = content.find('</form>', start_idx) + 7

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_form + content[end_idx:]
else:
    print("Could not find form tags!")
    exit(1)

# 2. Inject states
state_injection = """
  const [isEditingInfo, setIsEditingInfo] = useState(true);
  const [activeInnerTabs, setActiveInnerTabs] = useState<Record<string, string>>({});
  const [roomCostInput, setRoomCostInput] = useState<Record<string, string>>({});
  const [serviceCostInput, setServiceCostInput] = useState<Record<string, string>>({});
"""
if "const [isEditingInfo" not in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState(\"sales\");",
        "const [activeTab, setActiveTab] = useState(\"sales\");" + state_injection
    )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected V4 layout into create/page.tsx")
