import sys
import re

files_to_process = [
    "frontend/src/app/projects/[id]/AccommodationTabOptimized.tsx",
    "frontend/src/app/projects/[id]/DigerTab.tsx",
    "frontend/src/app/projects/[id]/FinancialTab.tsx",
    "frontend/src/app/projects/[id]/NotesTab.tsx",
    "frontend/src/app/projects/[id]/OdemeTab.tsx",
    "frontend/src/app/projects/[id]/TahsilatTab.tsx",
    "frontend/src/app/projects/[id]/TransferTurTab.tsx",
    "frontend/src/app/projects/[id]/UcakBiletiTab.tsx"
]

DISABLE_STR = " disabled={!permEdit || (isLocked && !isSuperAdmin)} "

for filepath in files_to_process:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        continue
        
    original_content = content
    
    # 1. Ensure usePermissions is imported and destructured
    if "usePermissions" not in content:
        content = content.replace(
            "import React",
            'import { usePermissions, Module } from "@/lib/permissions";\nimport React'
        )
        comp_regex = re.compile(r'(export default function \w+\(.*?\)\s*\{)')
        content = comp_regex.sub(
            r'\1\n  const { canEdit, isSuperAdmin } = usePermissions();\n  const permEdit = canEdit(Module.PROJECTS);\n',
            content
        )
    elif "permEdit =" not in content and "permEdit:" not in content and "canEdit: permEdit" not in content:
        comp_regex = re.compile(r'(export default function \w+\(.*?\)\s*\{)')
        content = comp_regex.sub(
            r'\1\n  const { canEdit, isSuperAdmin } = usePermissions();\n  const permEdit = canEdit(Module.PROJECTS);\n',
            content
        )
        
    # State machine to find <input, <select, <textarea tags
    result = []
    i = 0
    while i < len(content):
        # Look for <input, <select, <textarea
        match = None
        for tag in ["<input", "<select", "<textarea"]:
            if content[i:].startswith(tag):
                if len(content) > i + len(tag) and content[i+len(tag)].isspace():
                    match = tag
                    break
        
        if match:
            # We found a tag start. Let's find its end '>'
            result.append(match)
            i += len(match)
            
            in_string = False
            string_char = ''
            in_jsx_expr = 0
            
            tag_content_start = i
            tag_content = ""
            
            while i < len(content):
                char = content[i]
                tag_content += char
                
                if in_string:
                    if char == string_char:
                        in_string = False
                elif in_jsx_expr > 0:
                    if char == '{':
                        in_jsx_expr += 1
                    elif char == '}':
                        in_jsx_expr -= 1
                    elif char in ["'", '"', "`"]:
                        in_string = True
                        string_char = char
                else:
                    if char in ["'", '"']:
                        in_string = True
                        string_char = char
                    elif char == '{':
                        in_jsx_expr += 1
                    elif char == '>' or (char == '/' and i+1 < len(content) and content[i+1] == '>'):
                        # Found end of tag
                        break
                        
                i += 1
                
            # Now tag_content contains everything up to the > or />
            # Let's check if it already has 'disabled='
            if "disabled=" not in tag_content and "disabled " not in tag_content:
                # We need to insert our DISABLE_STR right before the > or />
                # Since we broke when char == '>' or char == '/', we just append our string before the last char(s)
                if tag_content.endswith("/>"):
                    tag_content = tag_content[:-2] + DISABLE_STR + "/>"
                elif tag_content.endswith(">"):
                    tag_content = tag_content[:-1] + DISABLE_STR + ">"
                else:
                    # In case it didn't end with > (which shouldn't happen unless EOF)
                    tag_content += DISABLE_STR
                    
            result.append(tag_content)
            i += 1
        else:
            result.append(content[i])
            i += 1
            
    final_content = "".join(result)
    
    if final_content != original_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(final_content)
        print(f"Patched {filepath}")

