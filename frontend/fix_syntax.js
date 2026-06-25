const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Remove the portal block
const portalStartStr = "{isDateRangeOpen && typeof document !== 'undefined' && createPortal(";
const portalStartIndex = code.indexOf(portalStartStr);

if (portalStartIndex !== -1) {
  // Find the end of the portal block: "document.body\n      )}\n"
  const portalEndStr = "document.body\n      )}\n";
  const portalEndIndex = code.indexOf(portalEndStr, portalStartIndex);
  if (portalEndIndex !== -1) {
    code = code.substring(0, portalStartIndex) + code.substring(portalEndIndex + portalEndStr.length);
  }
}

// 2. Remove the extra closing </div> at the end.
// The file should end with:
//   );
// }
// If there are multiple </div> before that, we delete one.
// Let's look at the end of the file:
const endRegex = /<\/div>\s*<\/div>\s*\);\s*}\s*$/;
if (endRegex.test(code)) {
  code = code.replace(/<\/div>\s*<\/div>\s*\);\s*}\s*$/, "</div>\n  );\n}\n");
}

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed syntax error!');
