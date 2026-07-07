import os

tabs = [
    "DigerTab.tsx",
    "TahsilatTab.tsx",
    "OdemeTab.tsx",
    "PurchaseTab.tsx",
    "SalesTab.tsx",
    "KarZararTab.tsx"
]

for tab in tabs:
    path = f"/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/app/projects/[id]/{tab}"
    if not os.path.exists(path): continue
    
    with open(path, "r") as f:
        content = f.read()
        
    if "FieldsetGuard" not in content:
        import_stmt = 'import FieldsetGuard from "@/components/permissions/FieldsetGuard";\nimport PermissionBoundary from "@/components/permissions/PermissionBoundary";'
        
        if 'import { usePermissions, Module } from "@/lib/permissions";' in content:
            content = content.replace('import { usePermissions, Module } from "@/lib/permissions";', f'import {{ usePermissions, Module, Permission }} from "@/lib/permissions";\n{import_stmt}')
        elif 'import { usePermissions } from "@/lib/permissions";' in content:
            content = content.replace('import { usePermissions } from "@/lib/permissions";', f'import {{ usePermissions, Module, Permission }} from "@/lib/permissions";\n{import_stmt}')
        elif 'import { usePermissions, Module, Permission } from "@/lib/permissions";' not in content:
            # Need to add the imports somewhere. Let's just put it after 'use client';
            content = content.replace('"use client";', f'"use client";\n\nimport {{ usePermissions, Module, Permission }} from "@/lib/permissions";\n{import_stmt}')
            
        with open(path, "w") as f:
            f.write(content)
        print(f"Added imports to {tab}")

