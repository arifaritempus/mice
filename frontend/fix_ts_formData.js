const fs = require('fs');

function fixFormDataInit(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    const target = `    room_count: 0,
    pax_count: 0,`;
    const replacement = `    room_count: 0,
    pax_count: 0,
    budget_currency: "EUR",
    forecast_revenue: 0,
    forecast_cost: 0,
    management_fee_percentage: 0,
    association_share_percentage: 0,`;
    
    if (code.includes(target) && !code.includes('budget_currency: "EUR"')) {
        code = code.replace(target, replacement);
        fs.writeFileSync(filePath, code);
        console.log("Fixed formData in", filePath);
    } else {
        console.log("Skipped or already fixed", filePath);
    }
}

fixFormDataInit('src/app/quotes/[id]/edit/page.tsx');
fixFormDataInit('src/app/quotes/create/page.tsx');
