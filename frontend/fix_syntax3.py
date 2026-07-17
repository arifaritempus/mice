import os

file_path = 'src/app/projects/[id]/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the specific line 10609 that caused the error:
content = content.replace('message: "Araç ataması için {t(\'projects.vehicleType\') || "Araç Tipi"}, {t(\'projects.supplier\') || "Tedarikçi"} ve {t(\'projects.costAmount\') || "Maliyet Tutarı"} alanlarının doldurulması zorunludur!",',
                          'message: `Araç ataması için ${t(\'projects.vehicleType\') || "Araç Tipi"}, ${t(\'projects.supplier\') || "Tedarikçi"} ve ${t(\'projects.costAmount\') || "Maliyet Tutarı"} alanlarının doldurulması zorunludur!`,')

# Fix comments where it broke things or doesn't matter (just to be clean)
content = content.replace('// {t(\'projects.supplier\') || "Tedarikçi"} arama', '// Tedarikçi arama')
content = content.replace('// {t(\'projects.supplier\') || "Tedarikçi"} dropdown', '// Tedarikçi dropdown')
content = content.replace('// {t(\'projects.supplier\') || "Tedarikçi"} + Otel', '// Tedarikçi + Otel')
content = content.replace('// {t(\'projects.supplier\') || "Tedarikçi"}leri ve otelleri', '// Tedarikçileri ve otelleri')
content = content.replace('// Otel/{t(\'projects.supplier\') || "Tedarikçi"}', '// Otel/Tedarikçi')
content = content.replace('// {t(\'projects.currency\') || "Döviz"} cinsine', '// Döviz cinsine')
content = content.replace('// {t(\'projects.currency\') || "Döviz"} toplamını', '// Döviz toplamını')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done fixing syntax3')
