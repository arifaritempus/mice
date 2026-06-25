const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Sidebar.tsx', 'utf8');

// The width of the sidebar container
content = content.replace(
  /isCollapsed && !isHovered \? 'w-20' : 'w-64'/g,
  "(isCollapsed && !isHovered && !isMobileOpen) ? 'w-20' : 'w-64'"
);

// The logo rendering
content = content.replace(
  /isCollapsed && !isHovered \? 'h-10 w-10' : 'h-24 w-full'/g,
  "(isCollapsed && !isHovered && !isMobileOpen) ? 'h-10 w-10' : 'h-24 w-full'"
);

// renderItem logic (px-0)
content = content.replace(
  /isCollapsed && !isHovered \? 'justify-center px-0' : ''/g,
  "(isCollapsed && !isHovered && !isMobileOpen) ? 'justify-center px-0' : ''"
);

// renderItem logic (showing text)
// Note: (!isCollapsed || isHovered)
content = content.replace(
  /\(!isCollapsed \|\| isHovered\)/g,
  "(!isCollapsed || isHovered || isMobileOpen)"
);

// logo state
content = content.replace(
  /if \(isCollapsed && !isHovered\) {/g,
  "if (isCollapsed && !isHovered && !isMobileOpen) {"
);

fs.writeFileSync('frontend/src/components/Sidebar.tsx', content);
console.log('Sidebar mobile expanded logic patched.');
