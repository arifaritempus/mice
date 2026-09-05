const fs = require('fs');
let code = fs.readFileSync('src/app/operations/transfers/page.tsx', 'utf8');

const target = `const unitPrice = Number(tr?.price ?? tr?.costPrice ?? 0);
          const currency =
            tr?.currency || tr?.costCurrency || sejour.currency || "EUR";`;

const replacement = `const unitPrice = Number(tr?.cost_price ?? tr?.costPrice ?? tr?.cost_amount ?? 0);
          const currency =
            tr?.cost_currency || tr?.costCurrency || tr?.currency || sejour.currency || "EUR";`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/app/operations/transfers/page.tsx', code);
    console.log("Fixed Sejour cost logic");
} else {
    console.log("Could not find target");
}
