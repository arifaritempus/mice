const fs = require('fs');
const path = require('path');

let textWhiteCount = 0;
let bgDarkCount = 0;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next') walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx')) callback(dirPath);
    }
  });
}

walkDir('./src/app', (file) => {
  const content = fs.readFileSync(file, 'utf8');
  const classMatches = content.match(/className="([^"]+)"/g) || [];
  classMatches.forEach(cls => {
    if (cls.includes('text-white') && !cls.match(/bg-(blue|emerald|red|orange|green|indigo|purple|amber|rose|teal)-[567]00/)) {
      textWhiteCount++;
    }
    if (cls.includes('bg-[#0f172a]')) {
      bgDarkCount++;
    }
  });
});

console.log('text-white without solid bg:', textWhiteCount);
console.log('bg-[#0f172a]:', bgDarkCount);
