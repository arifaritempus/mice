import os
import re

files = [
    "frontend/src/app/sejour/[id]/edit/page.tsx",
    "frontend/src/app/sejour/create/page.tsx"
]

format_helper = """
const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return dateStr;
};
"""

def apply_v30(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Inject format helper right after DateInput
    if "const formatDateDisplay =" not in content:
        content = content.replace('const DateInput =', format_helper + '\nconst DateInput =')

    # Replace summary texts
    content = content.replace(
        "{salesData.checkInDate} / {salesData.checkOutDate}",
        "{formatDateDisplay(salesData.checkInDate)} / {formatDateDisplay(salesData.checkOutDate)}"
    )

    content = content.replace(
        "{(flights[0] as any).departureDate || '-'} - {(flights[0] as any).returnDate || '-'}",
        "{formatDateDisplay((flights[0] as any).departureDate)} - {formatDateDisplay((flights[0] as any).returnDate)}"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"SUCCESSFULLY APPLIED V30 SUMMARY DATES IN {filepath}")

for fp in files:
    apply_v30(fp)
