import sys

with open("frontend/src/app/requests/edit/[id]/page.tsx", "r") as f:
    text = f.read()

# Replace the component tag
text = text.replace("<DateRangeField", "<ResponsiveDateRangeField")
text = text.replace("</DateRangeField>", "</ResponsiveDateRangeField>")

# Replace the import
if 'import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";' not in text:
    text = text.replace(
        'import DateRangeField from "@/components/DateRangeField";',
        'import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";\nimport DateRangeField from "@/components/DateRangeField";'
    )

with open("frontend/src/app/requests/edit/[id]/page.tsx", "w") as f:
    f.write(text)

print("DateRangeField replaced with ResponsiveDateRangeField!")
