const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next') {
        walkDir(dirPath, callback);
      }
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/\btext-brand-primary\b/g, 'text-blue-400');
  content = content.replace(/\bbg-brand-primary\b/g, 'bg-blue-500');
  content = content.replace(/\bhover:bg-brand-primary\/90\b/g, 'hover:bg-blue-600');
  content = content.replace(/\bbg-brand-primary\/10\b/g, 'bg-blue-500/10');
  
  content = content.replace(/bg-brand-primary\/([0-9]+)/g, 'bg-blue-500/$1');
  content = content.replace(/border-brand-primary\/([0-9]+)/g, 'border-blue-500/$1');
  content = content.replace(/text-brand-primary\/([0-9]+)/g, 'text-blue-500/$1');
  
  content = content.replace(/bg-theme-main\/([0-9]+)/g, 'bg-[#0f172a]/$1');
  content = content.replace(/\bbg-theme-main\b/g, 'bg-[#0f172a]');
  
  content = content.replace(/\btext-theme-text\b/g, 'text-white');
  content = content.replace(/\btext-theme-muted\b/g, 'text-slate-400');
  
  content = content.replace(/border-theme-border\/50/g, 'border-white/5');
  content = content.replace(/border-theme-border/g, 'border-white/10');
  
  content = content.replace(/bg-theme-surface\/40/g, 'bg-white/5');
  content = content.replace(/bg-theme-surface\/60/g, 'bg-white/10');
  
  content = content.replace(/hover:bg-theme-surface\/60/g, 'hover:bg-white/5');
  content = content.replace(/hover:text-theme-text/g, 'hover:text-white');

  content = content.replace(/drop-shadow-sm/g, 'glow-text');

  content = content.replace(/dark:text-theme-text/g, 'dark:text-white');
  content = content.replace(/dark:bg-theme-surface/g, 'dark:bg-slate-800');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Reverted: ' + filePath);
  }
}

walkDir('./src/app', processFile);
walkDir('./src/components', processFile);
