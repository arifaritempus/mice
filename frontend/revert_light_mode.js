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

  content = content.replace(/bg-white dark:bg-\[\#0f172a\]\/40 shadow-sm dark:shadow-none/g, 'bg-[#0f172a]/40');
  content = content.replace(/bg-white dark:bg-\[\#0f172a\]\/60 shadow-sm dark:shadow-none/g, 'bg-[#0f172a]/60');
  content = content.replace(/bg-slate-50 dark:bg-\[\#0f172a\]/g, 'bg-[#0f172a]');
  
  content = content.replace(/bg-white dark:bg-slate-900\/40 shadow-sm dark:shadow-none/g, 'bg-slate-900/40');
  content = content.replace(/bg-white dark:bg-slate-900\/60 shadow-sm dark:shadow-none/g, 'bg-slate-900/60');
  content = content.replace(/bg-slate-50 dark:bg-slate-900/g, 'bg-slate-900');
  
  content = content.replace(/bg-white\/60 dark:bg-white\/5 shadow-sm dark:shadow-none/g, 'bg-white/5');
  content = content.replace(/bg-white\/80 dark:bg-white\/10 shadow-sm dark:shadow-none/g, 'bg-white/10');
  
  content = content.replace(/border-slate-200 dark:border-white\/10/g, 'border-white/10');
  content = content.replace(/border-slate-100 dark:border-white\/5/g, 'border-white/5');
  content = content.replace(/border-slate-200 dark:border-slate-800/g, 'border-slate-800');
  
  content = content.replace(/text-slate-500 dark:text-slate-400/g, 'text-slate-400');
  content = content.replace(/text-slate-600 dark:text-slate-300/g, 'text-slate-300');
  
  content = content.replace(/text-slate-800 dark:text-white/g, 'text-white');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Reverted: ' + filePath);
  }
}

walkDir('./src/app', processFile);
walkDir('./src/components', processFile);
