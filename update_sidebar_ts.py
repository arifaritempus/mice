import re

with open("frontend/src/components/Sidebar.tsx", "r") as f:
    text = f.read()

text = text.replace(
    'label: t(\'menu.requests\') || "Talepler",',
    'label: "Talepler",'
)

with open("frontend/src/components/Sidebar.tsx", "w") as f:
    f.write(text)
print("Updated Sidebar.tsx")
