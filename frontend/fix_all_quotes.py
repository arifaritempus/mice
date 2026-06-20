import os
import glob

def fix_file(filepath):
    with open(filepath, "r") as f:
        original_content = f.read()

    content = original_content

    # The issue: "\'" instead of just "'" inside the typeof document expressions
    content = content.replace("typeof document !== \\'undefined\\'", "typeof document !== \"undefined\"")
    content = content.replace("document.title.split(\\'-')", "document.title.split(\"-\")")
    content = content.replace("document.title.split(\\'-\\')", "document.title.split(\"-\")")
    content = content.replace(": \\'MICE\\'}", ": \"MICE\"}")
    content = content.replace(": \\'Firma\\')", ": \"Firma\")")

    # Fix the closing backticks instead of single quotes for template strings
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
    
    # New ones from the errors
    content = content.replace("} - Sejour Listesi');", "} - Sejour Listesi`);")
    content = content.replace("} - Bilet Opsiyonları');", "} - Bilet Opsiyonları`);")
    content = content.replace("} - Bilet Ödemeleri');", "} - Bilet Ödemeleri`);")

    # In case they were just unescaped single quotes
    content = content.replace("} - Sejour Listesi\');", "} - Sejour Listesi`);")
    content = content.replace("} - Bilet Opsiyonları\');", "} - Bilet Opsiyonları`);")
    content = content.replace("} - Bilet Ödemeleri\');", "} - Bilet Ödemeleri`);")

    if content != original_content:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Fixed {filepath}")

# Recursively find all ts and tsx files
src_dir = "/Users/arifari/Desktop/TT_Sistem_AG/frontend/src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            fix_file(os.path.join(root, file))

print("Done")
