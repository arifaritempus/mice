import sys

def fix_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # The issue: "\'" instead of just "'" inside the typeof document expressions
    content = content.replace("typeof document !== \\'undefined\\'", "typeof document !== \"undefined\"")
    content = content.replace("document.title.split(\\'-')", "document.title.split(\"-\")")
    content = content.replace("document.title.split(\\'-\\')", "document.title.split(\"-\")")
    content = content.replace(": \\'MICE\\'}", ": \"MICE\"}")
    content = content.replace(": \\'Firma\\')", ": \"Firma\")")

    # The end of the strings have incorrect single quotes instead of backticks
    content = content.replace("} - Teklifler');", "} - Teklifler`);")
    content = content.replace("} - Biletler (Detay)');", "} - Biletler (Detay)`);")
    content = content.replace("} - Biletler (Özet)');", "} - Biletler (Özet)`);")
    content = content.replace("} - Teklif');", "} - Teklif`);")
    content = content.replace("} - Kullanıcılar');", "} - Kullanıcılar`);")
    content = content.replace("} - Uçak Bileti Raporu');", "} - Uçak Bileti Raporu`);")
    content = content.replace("} - Otel Ekstra Raporu');", "} - Otel Ekstra Raporu`);")
    content = content.replace("} - Diğer Servisler Raporu');", "} - Diğer Servisler Raporu`);")
    content = content.replace("} - Finansal Raporu');", "} - Finansal Raporu`);")
    content = content.replace("} - Etkinlik & Aktivite Raporu');", "} - Etkinlik & Aktivite Raporu`);")
    content = content.replace("} - İnsan Kaynakları Raporu');", "} - İnsan Kaynakları Raporu`);")
    content = content.replace("} - Konaklama Listesi');", "} - Konaklama Listesi`);")

    with open(filepath, "w") as f:
        f.write(content)

files = [
    "/Users/arifari/Desktop/TT_Sistem_AG/frontend/src/app/sejour/[id]/edit/page.tsx",
    "/Users/arifari/Desktop/TT_Sistem_AG/frontend/src/utils/excelUtils.ts",
    "/Users/arifari/Desktop/TT_Sistem_AG/frontend/src/app/projects/[id]/page.tsx"
]

for file in files:
    fix_file(file)
print("Done")
