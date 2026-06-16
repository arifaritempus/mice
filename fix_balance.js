const fs = require('fs');
const execSync = require('child_process').execSync;

// 1. Sidebar.tsx
const sidebarPath = 'frontend/src/components/Sidebar.tsx';
let sidebar = fs.readFileSync(sidebarPath, 'utf8');
// Add mobile top bar and responsive logic back to Sidebar, but using 'sm:' instead of 'lg:' or 'md:'
// Actually, let's just git checkout the version I had before I reverted, and then replace md: with sm:
execSync('git checkout e5efbb5 frontend/src/components/Sidebar.tsx frontend/src/components/AuthWrapper.tsx');
sidebar = fs.readFileSync(sidebarPath, 'utf8');
sidebar = sidebar
  .replace(/md:hidden/g, 'sm:hidden')
  .replace(/md:relative/g, 'sm:relative')
  .replace(/md:w-20/g, 'sm:w-20')
  .replace(/md:w-64/g, 'sm:w-64')
  .replace(/md:shadow-none/g, 'sm:shadow-none')
  .replace(/md:translate-x-0/g, 'sm:translate-x-0')
  .replace(/md:block/g, 'sm:block')
  .replace(/lg:hidden/g, 'sm:hidden')
  .replace(/lg:relative/g, 'sm:relative')
  .replace(/lg:w-20/g, 'sm:w-20')
  .replace(/lg:w-64/g, 'sm:w-64')
  .replace(/lg:shadow-none/g, 'sm:shadow-none')
  .replace(/lg:translate-x-0/g, 'sm:translate-x-0')
  .replace(/lg:block/g, 'sm:block');
fs.writeFileSync(sidebarPath, sidebar);

// 2. AuthWrapper.tsx
const authWrapperPath = 'frontend/src/components/AuthWrapper.tsx';
let authWrapper = fs.readFileSync(authWrapperPath, 'utf8');
authWrapper = authWrapper.replace(/md:flex-row/g, 'sm:flex-row').replace(/lg:flex-row/g, 'sm:flex-row');
fs.writeFileSync(authWrapperPath, authWrapper);

// 3. Grid Filters
const diff = execSync('git diff HEAD frontend/src/app').toString();
const files = execSync("find frontend/src/app -name '*.tsx'").toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We want to replace `<div className="grid..." style={{ gridTemplateColumns: 'X' }}>`
  // with `<div className="grid w-full items-end gap-2 grid-cols-1 sm:grid-cols-[X]">`
  content = content.replace(
    /<div\s+className="grid[^"]*"\s*style=\{\{\s*gridTemplateColumns:\s*'([^']+)'\s*\}\}\s*>/g,
    (match, styleString) => {
      // Replace spaces in styleString with underscores for Tailwind arbitrary value
      const tailwindGrid = styleString.replace(/\s+/g, '_');
      return `<div className="grid w-full items-end gap-2 grid-cols-1 sm:grid-cols-[${tailwindGrid}]">`;
    }
  );

  // Also replace any remaining rigid arbitrary grids from the `fix_quotes.js` script
  content = content.replace(
    /className="grid([^"]*)grid-cols-\[([^\]]+)\]"/g,
    (match, prefix, customMatch) => {
      if (match.includes('sm:grid-cols-')) return match; // Already responsive
      return `className="grid w-full items-end gap-2 grid-cols-1 sm:grid-cols-[${customMatch}]"`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Made grid responsive at sm: in", file);
  }
});
