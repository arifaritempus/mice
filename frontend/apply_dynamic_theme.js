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

  // Colors mapping
  content = content.replace(/\btext-blue-400\b/g, 'text-brand-primary');
  content = content.replace(/\btext-blue-500\b/g, 'text-brand-primary');
  content = content.replace(/\bbg-blue-500\b/g, 'bg-brand-primary');
  content = content.replace(/\bbg-blue-600\b/g, 'bg-brand-primary');
  content = content.replace(/\bhover:bg-blue-600\b/g, 'hover:bg-brand-primary/90');
  content = content.replace(/\bhover:bg-blue-700\b/g, 'hover:bg-brand-primary/90');
  content = content.replace(/\bbg-blue-50\b/g, 'bg-brand-primary/10');
  content = content.replace(/\bh-12 w-12 rounded-full bg-blue-100\b/g, 'h-12 w-12 rounded-full bg-brand-primary/20');
  
  // Opacities
  content = content.replace(/bg-blue-500\/([0-9]+)/g, 'bg-brand-primary/$1');
  content = content.replace(/border-blue-500\/([0-9]+)/g, 'border-brand-primary/$1');
  content = content.replace(/text-blue-500\/([0-9]+)/g, 'text-brand-primary/$1');
  
  // Surface / Background
  content = content.replace(/bg-\[\#0f172a\]\/([0-9]+)/g, 'bg-theme-main/$1');
  content = content.replace(/bg-\[\#0f172a\]/g, 'bg-theme-main');
  content = content.replace(/\bbg-slate-900\b/g, 'bg-theme-main');
  
  // Text
  content = content.replace(/\btext-white\b/g, 'text-theme-text');
  content = content.replace(/\btext-slate-400\b/g, 'text-theme-muted');
  content = content.replace(/\btext-slate-300\b/g, 'text-theme-text');
  
  // Border
  content = content.replace(/border-white\/10/g, 'border-theme-border');
  content = content.replace(/border-white\/5/g, 'border-theme-border/50');
  
  // Cards
  content = content.replace(/bg-white\/5/g, 'bg-theme-surface/40');
  content = content.replace(/bg-white\/10/g, 'bg-theme-surface/60');
  
  // Hover states for surfaces
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-theme-surface/60');
  content = content.replace(/hover:text-white/g, 'hover:text-theme-text');

  // Specific glow texts
  content = content.replace(/glow-text/g, 'drop-shadow-sm');

  // Strip dark: prefixes where possible to let CSS vars handle it, but it's safer to just let them be, 
  // actually 'dark:text-white' might conflict if we change text-white. 
  // Let's replace dark:text-white with dark:text-theme-text
  content = content.replace(/dark:text-white/g, 'dark:text-theme-text');
  content = content.replace(/dark:bg-slate-800/g, 'dark:bg-theme-surface');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

walkDir('./src/app', processFile);
walkDir('./src/components', processFile);
