import re

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# The leftover starts somewhere after the new modal ends.
# The new modal ends with "Yanıtı Kaydet\n              </button>\n            </div>\n          </div>\n        </div>\n      )}"
# Then the leftover is:
# "            \n            <div className=\"space-y-4\">" or something.

match = re.search(r'Yanıtı Kaydet\s*</button>\s*</div>\s*</div>\s*</div>\s*\)\}(.*?)</div>\s*</div>\s*\);\s*\}', text, re.DOTALL)
if match:
    leftover = match.group(1)
    text = text.replace(leftover, "\n    ")

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("Fixed leftover modal!")
