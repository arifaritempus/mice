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
walkDir('/Users/arifari/Desktop/TT_Sistem_AG/frontend/src/utils', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/'TEMPUS TRAVEL - /g, '`${typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'MICE\\\'} - ');
    content = content.replace(/"TEMPUS TRAVEL - /g, '`${typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'MICE\\\'} - ');
    content = content.replace(/'TEMPUS TRAVEL'/g, '(typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'Firma\\\')');
    content = content.replace(/"TEMPUS TRAVEL"/g, '(typeof document !== \\\'undefined\\\' ? document.title.split(\\\'-\\\')[0].trim() : \\\'Firma\\\')');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
        count++;
    }
});
console.log('Total files updated in utils:', count);
