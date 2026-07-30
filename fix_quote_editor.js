const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/QuoteServiceEditor.tsx', 'utf-8');

const oldSort = `      .sort((a, b) => {
        const aKey = (a.code || a.name || "").toString();
        const bKey = (b.code || b.name || "").toString();
        return aKey.localeCompare(bKey, "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });`;

const newSort = `      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.name || "").localeCompare(b.name || "", "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });`;

code = code.replace(oldSort, newSort);
fs.writeFileSync('frontend/src/components/QuoteServiceEditor.tsx', code);
console.log("QuoteServiceEditor sorting fixed!");
