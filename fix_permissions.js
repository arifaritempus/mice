const fs = require('fs');
const path = require('path');

const files = [
  "frontend/src/app/projects/[id]/AccommodationTabOptimized.tsx",
  "frontend/src/app/projects/[id]/DigerTab.tsx",
  "frontend/src/app/projects/[id]/FinancialTab.tsx",
  "frontend/src/app/projects/[id]/NotesTab.tsx",
  "frontend/src/app/projects/[id]/OdemeTab.tsx",
  "frontend/src/app/projects/[id]/TahsilatTab.tsx",
  "frontend/src/app/projects/[id]/TransferTurTab.tsx",
  "frontend/src/app/projects/[id]/UcakBiletiTab.tsx"
];

const disableLogic = "{!permEdit || (isLocked && !isSuperAdmin)}";
const buttonDisableLogic = "{!permEdit || (isLocked && !isSuperAdmin) || saving}";

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  // Ensure usePermissions is imported
  if (!content.includes('usePermissions')) {
    content = content.replace(
      'import React',
      'import { usePermissions, Module } from "@/lib/permissions";\nimport React'
    );
    // Find where component starts
    const compRegex = /export default function \w+\(.*?\)\s*\{/;
    content = content.replace(compRegex, (match) => {
      return match + `\n  const { canEdit, isSuperAdmin } = usePermissions();\n  const permEdit = canEdit(Module.PROJECTS);\n`;
    });
  } else {
    // If imported, ensure permEdit and isSuperAdmin are extracted if not already
    if (!content.includes('permEdit')) {
      const compRegex = /export default function \w+\(.*?\)\s*\{/;
      content = content.replace(compRegex, (match) => {
        return match + `\n  const { canEdit, isSuperAdmin } = usePermissions();\n  const permEdit = canEdit(Module.PROJECTS);\n`;
      });
    }
  }

  // Regex to match <input ...>, <select ...>, <textarea ...> that don't have 'disabled'
  const tagRegex = /<(input|select|textarea)(\s+[^>]*?)?(?<!disabled(=\{[^\}]+\}|="[^"]*"|))(\/?)>/g;
  content = content.replace(tagRegex, (match, tag, attrs, closing) => {
    // Check again to be safe
    if (match.includes('disabled')) return match;
    return `<${tag}${attrs || ''} disabled=${disableLogic}${closing}>`;
  });

  // Buttons are tricky. Only disable buttons that have text like "Kaydet", "Ekle", "Sil", "Güncelle", "Yeni"
  // Actually, wait, let's target onClick handlers instead? Or just leave buttons for now and use FieldsetGuard.
  // Wait, if I just add FieldsetGuard around the tables and forms, it's safer.
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
