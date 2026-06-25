const fs = require('fs');

// 1. Revert globals.css
let globals = fs.readFileSync('src/app/globals.css', 'utf8');
globals = globals.replace(/:root_temp/g, ':root');
globals = globals.replace(/\.dark_temp/g, '.dark');
globals = globals.replace(/body_temp/g, 'body');

// Also remove the new dynamic vars and restore the old:
const oldGlobals = `
:root {
  --theme-bg-primary: #f8fafc;
  --theme-bg-secondary: #eef2ff;
  --theme-card-bg: rgba(255, 255, 255, 0.7);
  --theme-text-color: #0f172a;
  --theme-sidebar-bg: rgba(255, 255, 255, 0.6);
  --theme-sidebar-header-bg: transparent;
  --theme-sidebar-border: rgba(15, 23, 42, 0.08);
}

.dark {
  /* V3 Dark Mode: Deep slate background, semi-transparent surfaces */
  --theme-bg-primary: #020617; /* Slate 950 */
  --theme-bg-secondary: #020617; /* Slate 950 */
  --theme-card-bg: rgba(15, 23, 42, 0.65); /* Slate 900 with opacity */
  --theme-text-color: #f8fafc; /* Slate 50 */
  --theme-sidebar-bg: rgba(15, 23, 42, 0.4); /* Glass sidebar */
  --theme-sidebar-header-bg: transparent;
  --theme-sidebar-border: rgba(51, 65, 85, 0.4); /* Subtle border */
}

/* Base Body Style for V3 */
body {
  background-color: var(--theme-bg-primary);
  background-image: radial-gradient(circle at top left, rgba(30, 58, 138, 0.15), transparent 40%),
                    radial-gradient(circle at bottom right, rgba(88, 28, 135, 0.1), transparent 40%);
  background-attachment: fixed;
  color: var(--theme-text-color);
}
`;
globals = globals.replace(/:root \{[\s\S]*?body \{[\s\S]*?\}/, oldGlobals.trim());
fs.writeFileSync('src/app/globals.css', globals, 'utf8');

// 2. Revert tailwind.config.js
let tailwind = fs.readFileSync('tailwind.config.js', 'utf8');
const oldTailwindColors = `      colors: {
        v3: {`;
tailwind = tailwind.replace(/colors: \{[\s\S]*?v3: \{/, oldTailwindColors);
fs.writeFileSync('tailwind.config.js', tailwind, 'utf8');

// 3. Revert layout.tsx
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const oldLayoutScript = `
              try {
                var theme = 'dark';
                document.documentElement.classList.add('dark');
                
                fetch('/api/theme-settings')
                  .then(res => res.json())
                  .then(settings => {
                    if (!settings) return;
                    var root = document.documentElement;
                    var isDark = root.classList.contains('dark');
                    
                    if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
                    if (settings.secondary_color) root.style.setProperty('--color-secondary', settings.secondary_color);
                    if (settings.accent_color) root.style.setProperty('--color-accent', settings.accent_color);
                    if (settings.success_color) root.style.setProperty('--color-success', settings.success_color);
                    if (settings.warning_color) root.style.setProperty('--color-warning', settings.warning_color);
                    if (settings.error_color) root.style.setProperty('--color-error', settings.error_color);
                    if (settings.info_color) root.style.setProperty('--color-info', settings.info_color);
                    
                    var textColor = isDark ? settings.dark_text_color : settings.light_text_color;
                    if (textColor) root.style.setProperty('--theme-text-color', textColor);
                  })
                  .catch(console.error);
              } catch (e) {}
`;
layout = layout.replace(/try \{[\s\S]*?\} catch \(e\) \{\}/, oldLayoutScript.trim());
layout = layout.replace(/backgroundColor: 'rgb\(var\(--theme-bg-main\)\)'/, "backgroundColor: 'var(--theme-bg-primary)'");
fs.writeFileSync('src/app/layout.tsx', layout, 'utf8');

// 4. Revert ThemeProvider.tsx
let themeProvider = fs.readFileSync('src/components/providers/ThemeProvider.tsx', 'utf8');
const oldApplyTheme = `
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setIsDark(systemTheme === 'dark');
    } else {
      root.classList.add(newTheme);
      setIsDark(newTheme === 'dark');
    }
    
    // Save to cookie
    setThemeCookie(newTheme);
  };
`;
themeProvider = themeProvider.replace(/const applyCustomColors[\s\S]*?const applyTheme = \(newTheme: Theme\) => \{[\s\S]*?setThemeCookie\(newTheme\);\n  \};/m, oldApplyTheme.trim());
fs.writeFileSync('src/components/providers/ThemeProvider.tsx', themeProvider, 'utf8');

