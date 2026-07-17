import os

files = [
    'src/app/quotes/view/[id]/page.tsx',
    'src/app/projects/view/[id]/page.tsx'
]

replacements = {
    "appSettings?.company_name": "appSettings?.companyName",
    "appSettings.company_name": "appSettings?.companyName",
    "appSettings?.company_phone": "appSettings?.companyPhone",
    "appSettings?.company_email": "appSettings?.companyEmail",
    "appSettings?.company_address": "appSettings?.companyAddress",
    
    "appSettings?.dark_icon_logo": "appSettings?.darkIconLogo",
    "appSettings.dark_icon_logo": "appSettings?.darkIconLogo",
    
    "appSettings?.light_icon_logo": "appSettings?.lightIconLogo",
    "appSettings.light_icon_logo": "appSettings?.lightIconLogo",
    
    "appSettings?.dark_menu_logo": "appSettings?.darkMenuLogo",
    "appSettings?.light_menu_logo": "appSettings?.lightMenuLogo",
    
    "appSettings?.light_bg_primary": "appSettings?.lightBgMain",
    "appSettings?.light_bg_secondary": "appSettings?.lightBgSecondary",
    "appSettings?.light_card_bg": "appSettings?.lightCard",
    "appSettings?.light_sidebar_border": "appSettings?.lightSidebarBorder",
    "appSettings?.light_text_color": "appSettings?.lightText",
    "appSettings?.secondary_color": "appSettings?.colorSecondary"
}

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath}")

print("Done mapping appSettings keys to camelCase in public pages")
