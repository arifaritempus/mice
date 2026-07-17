import glob

files = [
    'src/app/sejour/[id]/edit/page.tsx',
    'src/app/sejour/[id]/page.tsx',
    'src/app/sejour/create/page.tsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Company Name
    content = content.replace('generalSettings.company_name ||', 'generalSettings.companyName || generalSettings.company_name ||')
    
    # Company Email
    content = content.replace('generalSettings.company_email ||', 'generalSettings.companyEmail || generalSettings.company_email ||')
    content = content.replace('generalSettings.company_email?', 'generalSettings.companyEmail?')
    
    # Company Phone
    content = content.replace('generalSettings.company_phone ||', 'generalSettings.companyPhone || generalSettings.company_phone ||')
    
    # Company Address
    content = content.replace('generalSettings.company_address ||', 'generalSettings.companyAddress || generalSettings.company_address ||')
    
    # Company Website
    content = content.replace('generalSettings.company_website ||', 'generalSettings.companyWebsite || generalSettings.company_website ||')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Patched company info mappings in sejour pages")
