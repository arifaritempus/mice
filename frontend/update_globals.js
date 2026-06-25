const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

const themeVars = `
:root {
  /* Default Light Theme V3 Variables */
  --theme-primary: 37 99 235; /* blue-600 */
  --theme-bg-main: 248 250 252; /* slate-50 */
  --theme-surface: 255 255 255; /* white */
  --theme-border: 226 232 240; /* slate-200 */
  --theme-text: 15 23 42; /* slate-900 */
  --theme-text-muted: 100 116 139; /* slate-500 */
  
  --theme-bg-primary: var(--theme-bg-main); /* Legacy compat */
}

.dark {
  /* Default Dark Theme V3 Variables */
  --theme-primary: 59 130 246; /* blue-500 */
  --theme-bg-main: 15 23 42; /* #0f172a */
  --theme-surface: 15 23 42; /* Same as main for dark glass */
  --theme-border: 255 255 255; /* White (we use opacity like border-white/10) */
  --theme-text: 255 255 255; /* white */
  --theme-text-muted: 148 163 184; /* slate-400 */
}

/* Base Body Style for V3 Dynamic */
body {
  background-color: rgb(var(--theme-bg-main));
  color: rgb(var(--theme-text));
}
`;

// Replace the old :root and .dark and body blocks
code = code.replace(/:root \{[\s\S]*?\}/, ':root_temp');
code = code.replace(/\.dark \{[\s\S]*?\}/, '.dark_temp');
code = code.replace(/body \{[\s\S]*?\}/, 'body_temp');

code = code.replace(':root_temp', themeVars.split('.dark')[0].trim());
code = code.replace('.dark_temp', '.dark {\n' + themeVars.split('.dark {')[1].split('/* Base Body Style')[0].trim());
code = code.replace('body_temp', 'body {\n' + themeVars.split('body {')[1].trim());

fs.writeFileSync('src/app/globals.css', code, 'utf8');
