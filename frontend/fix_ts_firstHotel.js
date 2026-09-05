const fs = require('fs');

function fixFirstHotel(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    const target = 'const firstHotel = activeHotels[0] || {};';
    const replacement = 'const firstHotel: any = activeHotels[0] || {};';
    
    if (code.includes(target)) {
        code = code.replace(target, replacement);
        fs.writeFileSync(filePath, code);
        console.log("Fixed firstHotel in", filePath);
    } else {
        console.log("Skipped or already fixed", filePath);
    }
}

fixFirstHotel('src/app/quotes/[id]/edit/page.tsx');
fixFirstHotel('src/app/quotes/create/page.tsx');
