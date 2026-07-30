import sys

with open("frontend/src/components/QuoteServiceEditor.tsx", "r") as f:
    text = f.read()

text = text.replace('value={it.unit_quantity}', 'value={it.unit_quantity ?? ""}')
text = text.replace('value={it.sefer}', 'value={it.sefer ?? ""}')
text = text.replace('value={it.unit_price}', 'value={it.unit_price ?? ""}')
text = text.replace('value={it.currency}', 'value={it.currency ?? "EUR"}')

with open("frontend/src/components/QuoteServiceEditor.tsx", "w") as f:
    f.write(text)

print("Inputs fixed!")
