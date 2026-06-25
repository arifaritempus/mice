const fs = require('fs');
let code = fs.readFileSync('tailwind.config.js', 'utf8');

// Inject new colors into theme.extend.colors
const colorsInject = `
      colors: {
        brand: {
          primary: 'rgb(var(--theme-primary) / <alpha-value>)',
        },
        theme: {
          main: 'rgb(var(--theme-bg-main) / <alpha-value>)',
          surface: 'rgb(var(--theme-surface) / <alpha-value>)',
          border: 'rgb(var(--theme-border) / <alpha-value>)',
          text: 'rgb(var(--theme-text) / <alpha-value>)',
          muted: 'rgb(var(--theme-text-muted) / <alpha-value>)',
        },
        v3: {`;

code = code.replace(/colors: \{\s*v3: \{/, colorsInject);

fs.writeFileSync('tailwind.config.js', code, 'utf8');
