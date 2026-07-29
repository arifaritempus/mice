import re

for filepath in ["frontend/src/app/sejour/create/page.tsx", "frontend/src/app/sejour/[id]/edit/page.tsx"]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the block
    start_str = "  // --- V6 INJECTED STATES ---"
    end_str = "  // -------------------------"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str, start_idx)
    
    if start_idx != -1 and end_idx != -1:
        end_idx += len(end_str)
        block = content[start_idx:end_idx]
        
        # Remove it from current position
        content = content[:start_idx] + content[end_idx:]
        
        # Insert it at the top of the component
        if "edit" in filepath:
            insert_anchor = "export default function EditSejourPage() {"
        else:
            insert_anchor = "export default function CreateSejourPage() {"
            
        anchor_idx = content.find(insert_anchor)
        if anchor_idx != -1:
            insert_point = anchor_idx + len(insert_anchor)
            content = content[:insert_point] + "\n" + block + "\n" + content[insert_point:]
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
