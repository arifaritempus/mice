const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next') walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) callback(dirPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We only want to replace inside className="..." or `...` inside className
  // But doing it globally is easier if we are careful.
  // Actually, replacing background classes globally is safe because they are unique.
  content = content.replace(/bg-\[\#0f172a\]\/40/g, 'bg-white dark:bg-[#0f172a]/40 shadow-sm dark:shadow-none');
  content = content.replace(/bg-\[\#0f172a\]\/60/g, 'bg-white dark:bg-[#0f172a]/60 shadow-sm dark:shadow-none');
  content = content.replace(/bg-\[\#0f172a\]\b/g, 'bg-slate-50 dark:bg-[#0f172a]');
  
  content = content.replace(/bg-slate-900\/40/g, 'bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none');
  content = content.replace(/bg-slate-900\/60/g, 'bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none');
  content = content.replace(/\bbg-slate-900\b/g, 'bg-slate-50 dark:bg-slate-900');
  
  content = content.replace(/bg-white\/5\b/g, 'bg-white/60 dark:bg-white/5 shadow-sm dark:shadow-none');
  content = content.replace(/bg-white\/10\b/g, 'bg-white/80 dark:bg-white/10 shadow-sm dark:shadow-none');
  
  content = content.replace(/border-white\/10/g, 'border-slate-200 dark:border-white/10');
  content = content.replace(/border-white\/5/g, 'border-slate-100 dark:border-white/5');
  content = content.replace(/border-slate-800/g, 'border-slate-200 dark:border-slate-800');
  
  content = content.replace(/\btext-slate-400\b/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/\btext-slate-300\b/g, 'text-slate-600 dark:text-slate-300');

  // Text White requires context. Find all className strings.
  // We match className="...", className={'...'}, className={`...`}
  // A simple way is to match text-white globally, but look around.
  // Let's use a function replacer for className="([^"]+)"
  content = content.replace(/className="([^"]+)"/g, (match, cls) => {
    if (!cls.match(/bg-(blue|emerald|red|orange|green|indigo|purple|amber|rose|teal)-[567]00/)) {
      cls = cls.replace(/\btext-white\b/g, 'text-slate-800 dark:text-white');
    }
    // Cleanup duplicates if any
    cls = cls.replace(/text-slate-800 dark:text-slate-800 dark:text-white/g, 'text-slate-800 dark:text-white');
    return `className="${cls}"`;
  });

  // Template literals className={`...`}
  content = content.replace(/className=\{`([^`]+)`\}/g, (match, cls) => {
    if (!cls.match(/bg-(blue|emerald|red|orange|green|indigo|purple|amber|rose|teal)-[567]00/)) {
      cls = cls.replace(/\btext-white\b/g, 'text-slate-800 dark:text-white');
    }
    cls = cls.replace(/text-slate-800 dark:text-slate-800 dark:text-white/g, 'text-slate-800 dark:text-white');
    return `className={\`${cls}\`}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

walkDir('./src/app', processFile);
walkDir('./src/components', processFile);
