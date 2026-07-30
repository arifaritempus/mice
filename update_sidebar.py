import re

with open("frontend/src/components/Sidebar.tsx", "r") as f:
    text = f.read()

# We want to add requests under mice.
# Current mice block:
#     {
#       id: "mice",
#       label: t('menu.mice') || "MICE",
#       icon: "🎯",
#       module: Module.QUOTES,
#       children: [
#         {
#           id: "quotes",
#           label: t('menu.quotes') || "Teklif",
#           icon: "📋",
#           href: "/quotes",
#           module: Module.QUOTES,
#         },

pattern = r'(id: "mice",\s*label: t\(\'menu\.mice\'\) \|\| "MICE",\s*icon: "🎯",\s*module: Module\.QUOTES,\s*children: \[)'

new_child = """\\1
        {
          id: "requests",
          label: t('menu.requests') || "Talepler",
          icon: "📨",
          href: "/requests",
          module: Module.QUOTES,
        },"""

if re.search(pattern, text):
    text = re.sub(pattern, new_child, text)
    with open("frontend/src/components/Sidebar.tsx", "w") as f:
        f.write(text)
    print("Sidebar updated.")
else:
    print("Could not find mice menu in Sidebar.tsx")
