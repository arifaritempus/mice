import sys

with open("frontend/src/app/quotes/[id]/edit/page.tsx", "r") as f:
    text = f.read()

old_options = """                                <option value="1. OPSİYON">1. OPSİYON</option>
                                <option value="2. OPSİYON">2. OPSİYON</option>
                                <option value="SOR-SAT">SOR-SAT</option>"""

new_options = """                                <option value="1. Opsiyon">1. OPSİYON</option>
                                <option value="2. Opsiyon">2. OPSİYON</option>
                                <option value="Sor-Sat">SOR-SAT</option>"""

text = text.replace(old_options, new_options)

with open("frontend/src/app/quotes/[id]/edit/page.tsx", "w") as f:
    f.write(text)

print("Option casing fixed!")
