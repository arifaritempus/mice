const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let count = 0;
walkDir('/Users/arifari/Desktop/TT_Sistem_AG/frontend/src/app', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace 'TEMPUS TRAVEL - ' with dynamic prefix for excel exports
    content = content.replace(/'TEMPUS TRAVEL - /g, '`${typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'MICE\\\'} - ');
    // Handle "TEMPUS TRAVEL - "
    content = content.replace(/"TEMPUS TRAVEL - /g, '`${typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'MICE\\\'} - ');
    
    // For other generic strings like 'TEMPUS TRAVEL' as default company name
    content = content.replace(/'TEMPUS TRAVEL'/g, '(typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'Firma\\\')');
    content = content.replace(/"TEMPUS TRAVEL"/g, '(typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'Firma\\\')');

    // Also replace filename strings if they contain TEMPUS TRAVEL
    content = content.replace(/TEMPUS_TRAVEL_/g, '${typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim().replace(/\\\\s+/g, \\\'_\\\') : \\\'MICE\\\'}_');
    content = content.replace(/TEMPUS TRAVEL_/g, '${typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim().replace(/\\\\s+/g, \\\'_\\\') : \\\'MICE\\\'}_');
    content = content.replace(/TEMPUS TRAVEL /g, '${typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'MICE\\\'} ');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
        count++;
    }
});
console.log('Total files updated:', count);
