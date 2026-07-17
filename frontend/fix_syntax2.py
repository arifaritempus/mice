import os
import re

file_path = 'src/app/projects/[id]/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix array strings (Excel export headers)
content = content.replace('''"{t('projects.transferType') || "Transfer Tipi"}"''', '''(t('projects.transferType') || "Transfer Tipi")''')
content = content.replace('''"{t('projects.vehicleType') || "Araç Tipi"}"''', '''(t('projects.vehicleType') || "Araç Tipi")''')
content = content.replace('''"{t('projects.supplier') || "Tedarikçi"}"''', '''(t('projects.supplier') || "Tedarikçi")''')
content = content.replace('''"{t('projects.guests') || "Misafirler"}"''', '''(t('projects.guests') || "Misafirler")''')
content = content.replace('''"{t('projects.costAmount') || "Maliyet Tutarı"}"''', '''(t('projects.costAmount') || "Maliyet Tutarı")''')
content = content.replace('''"{t('projects.currency') || "Döviz"}"''', '''(t('projects.currency') || "Döviz")''')

# 2. Fix placeholders and titles which broke JSX
content = content.replace('''placeholder="{t('projects.guests') || "Misafirler"} (virgülle ayırın)"''', '''placeholder={`${t('projects.guests') || "Misafirler"} (virgülle ayırın)`}''')
content = content.replace('''title="{t('projects.guests') || "Misafirler"}i göster/gizle"''', '''title={`${t('projects.guests') || "Misafirler"}i göster/gizle`}''')

# 3. Fix broken object keys / string concatenations
content = content.replace('''fx: "{t('projects.currency') || "Döviz"} Kuru",''', '''fx: (t('projects.currency') || "Döviz") + " Kuru",''')
content = content.replace('''currency: "{t('projects.currency') || "Döviz"}",''', '''currency: t('projects.currency') || "Döviz",''')
content = content.replace('''supplier_id: "{t('projects.supplier') || "Tedarikçi"} ID",''', '''supplier_id: (t('projects.supplier') || "Tedarikçi") + " ID",''')
content = content.replace('''supplier_name: "{t('projects.supplier') || "Tedarikçi"} Adı",''', '''supplier_name: (t('projects.supplier') || "Tedarikçi") + " Adı",''')

# 4. Fix details.push template literal
content = content.replace('''`{t('projects.supplier') || "Tedarikçi"}: ${uuidMap[data.supplier_id]}`''', '''`${t('projects.supplier') || "Tedarikçi"}: ${uuidMap[data.supplier_id]}`''')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done fixing syntax2')
