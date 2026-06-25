const fs = require('fs');

// 1. layout.tsx
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
layout = layout.replace(/document\.documentElement\.classList\.add\('dark'\);/, `
var savedTheme = 'dark';
try {
  var match = document.cookie.match(/(^| )theme=([^;]+)/);
  if (match) savedTheme = match[2];
} catch(e) {}
if (savedTheme === 'system') {
  savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
document.documentElement.classList.add(savedTheme);
`);
fs.writeFileSync('src/app/layout.tsx', layout, 'utf8');

// 2. ThemeProvider.tsx
let themeProvider = fs.readFileSync('src/components/providers/ThemeProvider.tsx', 'utf8');
const newApplyTheme = `
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setIsDark(systemTheme === 'dark');
    } else {
      root.classList.add(newTheme);
      setIsDark(newTheme === 'dark');
    }
    setThemeCookie(newTheme);

    // Fetch and apply dynamic color
    fetch('/api/theme-settings')
      .then(res => res.json())
      .then(settings => {
        if (!settings || !settings.general_settings?.colorPrimary) return;
        
        function hexToRgb(hex: string) {
          var shorthandRegex = /^#?([a-f\\d])([a-f\\d])([a-f\\d])$/i;
          hex = hex.replace(shorthandRegex, function(m, r, g, b) { return r + r + g + g + b + b; });
          var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
          return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
        }

        var baseRgb = hexToRgb(settings.general_settings.colorPrimary);
        if (!baseRgb) return;

        var mix = function(c1: any, c2: any, weight: number) {
            return Math.round(c1.r * weight + c2.r * (1 - weight)) + ' ' +
                   Math.round(c1.g * weight + c2.g * (1 - weight)) + ' ' +
                   Math.round(c1.b * weight + c2.b * (1 - weight));
        };
        var white = { r: 255, g: 255, b: 255 };
        var black = { r: 0, g: 0, b: 0 };

        root.style.setProperty('--color-primary-50', mix(baseRgb, white, 0.1));
        root.style.setProperty('--color-primary-100', mix(baseRgb, white, 0.2));
        root.style.setProperty('--color-primary-200', mix(baseRgb, white, 0.4));
        root.style.setProperty('--color-primary-300', mix(baseRgb, white, 0.6));
        root.style.setProperty('--color-primary-400', mix(baseRgb, white, 0.8));
        root.style.setProperty('--color-primary-500', baseRgb.r + ' ' + baseRgb.g + ' ' + baseRgb.b);
        root.style.setProperty('--color-primary-600', mix(baseRgb, black, 0.8));
        root.style.setProperty('--color-primary-700', mix(baseRgb, black, 0.6));
        root.style.setProperty('--color-primary-800', mix(baseRgb, black, 0.4));
        root.style.setProperty('--color-primary-900', mix(baseRgb, black, 0.2));
        root.style.setProperty('--color-primary-950', mix(baseRgb, black, 0.1));
      })
      .catch(() => {});
  };
`;
themeProvider = themeProvider.replace(/const applyTheme = \(newTheme: Theme\) => \{[\s\S]*?setThemeCookie\('dark'\);[\s\S]*?setThemeCookie\(newTheme\);\n  \};/m, newApplyTheme.trim());
themeProvider = themeProvider.replace(/const applyTheme = \(newTheme: Theme\) => \{[\s\S]*?\}\s*\.catch\(\(\) => \{\}\);\n  \};/m, newApplyTheme.trim());
fs.writeFileSync('src/components/providers/ThemeProvider.tsx', themeProvider, 'utf8');

