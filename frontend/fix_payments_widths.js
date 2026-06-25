const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/payments/page.tsx', 'utf8');

// Replace Ödeme Tarihi wrapper
content = content.replace(
  '<div className="flex-1 min-w-[200px]">\n              <ResponsiveDateRangeField\n                label="Ödeme Tarihi"',
  '<div className="w-[160px] shrink-0">\n              <ResponsiveDateRangeField\n                label="Ödeme Tarihi"'
);

// Replace Uçuş Tarihi wrapper
content = content.replace(
  '<div className="flex-1 min-w-[200px]">\n              <ResponsiveDateRangeField\n                label="Uçuş Tarihi"',
  '<div className="w-[160px] shrink-0">\n              <ResponsiveDateRangeField\n                label="Uçuş Tarihi"'
);

// Genel arama wrapper is already flex-1 min-w-[300px], which is fine since the dates are now fixed width and shrink-0, but let's make sure it expands.
content = content.replace(
  '<div className="flex-1 min-w-[300px]">\n              <MultiTokenFilterInput\n                label="Genel Arama',
  '<div className="flex-[2] min-w-[300px]">\n              <MultiTokenFilterInput\n                label="Genel Arama'
);

fs.writeFileSync('src/app/tickets/payments/page.tsx', content, 'utf8');

console.log("Widths updated.");
