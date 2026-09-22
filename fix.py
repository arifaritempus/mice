import re

with open('frontend/src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

pattern = r"addOp\(sd, ed, t\('home\.project'\) \|\| \"Proje\", `\$\{t\('home\.project'\) \|\| \"Proje\"}: \$\{code\} \| C-IN: \$\{cIn\} \| C-OUT: \$\{cOut\} \| \$\{t\('home\.company'\) \|\| \"Firma\"\}: \$\{firma\} \| \$\{t\('home\.agency'\) \|\| \"Acente\"\}: \$\{acente\}`\, \"bg-blue-500\"\);"
replacement = r"const hotel = getHotelName(p.hotel_id, \"-\");\n      addOp(sd, ed, t('home.project') || \"Proje\", `${t('home.project') || \"Proje\"}: ${code} | C-IN: ${cIn} | C-OUT: ${cOut} | ${t('home.company') || \"Firma\"}: ${firma} | ${t('home.agency') || \"Acente\"}: ${acente} | Otel: ${hotel}`, \"bg-blue-500\");"

new_content = re.sub(pattern, replacement, content)

with open('frontend/src/app/dashboard/page.tsx', 'w') as f:
    f.write(new_content)

print("Replaced:", new_content != content)
