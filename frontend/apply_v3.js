const fs = require('fs');
const path = require('path');

const directories = ['./src/app', './src/components'];

const replacements = [
  // 1. App container backgrounds to transparent
  {
    regex: /min-h-screen\s+(?:bg-gray-50|bg-slate-50)\s+(?:dark:bg-gray-900|dark:bg-slate-900|dark:bg-gray-950)/g,
    replacement: 'min-h-screen bg-transparent'
  },
  // 2. Card/Panel backgrounds to glass-card
  {
    regex: /(?:bg-white\s+dark:bg-gray-800|bg-white\s+dark:bg-slate-800)\s+(?:rounded-xl|rounded-lg|rounded-2xl)\s+(?:shadow-md|shadow-sm|shadow-lg|shadow-xl)\s+(?:border\s+border-gray-200\s+dark:border-gray-700|border\s+border-slate-200\s+dark:border-slate-700|border\s+border-gray-100\s+dark:border-gray-800)/g,
    replacement: 'glass-card'
  },
  {
    regex: /(?:bg-white\s+dark:bg-gray-800|bg-white\s+dark:bg-slate-800)\s+(?:rounded-xl|rounded-lg|rounded-2xl)\s+border\s+(?:border-gray-200|border-slate-200)\s+dark:(?:border-gray-700|border-slate-700)\s+(?:shadow-md|shadow-sm|shadow-lg|shadow-xl)/g,
    replacement: 'glass-card'
  },
  {
    regex: /(?:bg-white|bg-slate-50)\s+dark:bg-(?:gray|slate)-800\s+(?:rounded-xl|rounded-lg|rounded-2xl)\s+(?:shadow-md|shadow-sm|shadow-lg)\s+(?:border\s+border-(?:gray|slate)-200\s+dark:border-(?:gray|slate)-700)/g,
    replacement: 'glass-card'
  }
];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts') || dirPath.endsWith('.jsx') || dirPath.endsWith('.js')) {
        callback(dirPath);
      }
    }
  });
}

let modifiedFiles = 0;

directories.forEach(dir => {
  walkDir(dir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    replacements.forEach(r => {
      content = content.replace(r.regex, r.replacement);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      console.log(`Updated: ${filePath}`);
    }
  });
});

console.log(`Total files modified: ${modifiedFiles}`);
