import re

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# Remove modal from MultiHotelSelect
match = re.search(r'      \{\/\* HOTEL RESPONSE MODAL \*\/.*?\}\)', text, re.DOTALL)
if match:
    modal_str = match.group(0)
    text = text.replace(modal_str, "")
    
    # Append it to the actual end of the file (before the last closing brace)
    text = text.replace("      </div>\n    </div>\n  );\n}", modal_str + "\n      </div>\n    </div>\n  );\n}")

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Fixed modal placement!")
