import os
import re

tabs = [
    "DigerTab.tsx",
    "TahsilatTab.tsx",
    "OdemeTab.tsx",
    "PurchaseTab.tsx",
    "SalesTab.tsx"
]

for tab in tabs:
    path = f"/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/app/projects/[id]/{tab}"
    if not os.path.exists(path): continue
    
    with open(path, "r") as f:
        content = f.read()
        
    # 1. Add imports if they don't exist
    if "FieldsetGuard" not in content:
        import_stmt = 'import FieldsetGuard from "@/components/permissions/FieldsetGuard";\nimport PermissionBoundary from "@/components/permissions/PermissionBoundary";'
        content = content.replace('import { usePermissions, Module } from "@/lib/permissions";', f'import {{ usePermissions, Module, Permission }} from "@/lib/permissions";\n{import_stmt}')
        if "import FieldsetGuard" not in content:
             content = content.replace('import { usePermissions } from "@/lib/permissions";', f'import {{ usePermissions, Module, Permission }} from "@/lib/permissions";\n{import_stmt}')
    
    # We will simply wrap the return statement's main div with FieldsetGuard, or the tables.
    # Actually, the user wants modularity. We should just wrap the main return content of the component.
    # We can do this manually to avoid messing up JSX like last time.
    
    print(f"Processed {tab} in dry run.")
