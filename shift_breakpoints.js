const fs = require('fs');

// 1. Sidebar.tsx
const sidebarPath = 'frontend/src/components/Sidebar.tsx';
let sidebar = fs.readFileSync(sidebarPath, 'utf8');
sidebar = sidebar
  .replace(/lg:hidden/g, 'md:hidden')
  .replace(/lg:relative/g, 'md:relative')
  .replace(/lg:w-20/g, 'md:w-20')
  .replace(/lg:w-64/g, 'md:w-64')
  .replace(/lg:shadow-none/g, 'md:shadow-none')
  .replace(/lg:translate-x-0/g, 'md:translate-x-0')
  .replace(/lg:block/g, 'md:block');
fs.writeFileSync(sidebarPath, sidebar);
console.log("Updated Sidebar.tsx breakpoints to md");

// 2. AuthWrapper.tsx
const authWrapperPath = 'frontend/src/components/AuthWrapper.tsx';
let authWrapper = fs.readFileSync(authWrapperPath, 'utf8');
authWrapper = authWrapper
  .replace(/lg:flex-row/g, 'md:flex-row');
fs.writeFileSync(authWrapperPath, authWrapper);
console.log("Updated AuthWrapper.tsx breakpoints to md");

// 3. Update all grid pages from lg:grid-cols to md:grid-cols
const execSync = require('child_process').execSync;
execSync("find frontend/src/app -name '*.tsx' -exec sed -i '' 's/lg:grid-cols-/md:grid-cols-/g' {} +");
execSync("find frontend/src/app -name '*.tsx' -exec sed -i '' 's/lg:min-w-full/md:min-w-full/g' {} +");
console.log("Updated grid breakpoints to md");
