const fs = require('fs');
const file = 'frontend/src/components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'dark_icon_logo': 'darkIconLogo',
  'dark_menu_logo': 'darkMenuLogo',
  'dark_wordmark_logo': 'darkWordmarkLogo',
  'light_icon_logo': 'lightIconLogo',
  'light_menu_logo': 'lightMenuLogo',
  'light_wordmark_logo': 'lightWordmarkLogo'
};

for (const [snake, camel] of Object.entries(replacements)) {
  content = content.replaceAll(snake, camel);
}

fs.writeFileSync(file, content);
console.log("Updated Sidebar.tsx");
