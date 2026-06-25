const fs = require('fs');

// 1. UPDATE globals.css
let globals = fs.readFileSync('src/app/globals.css', 'utf8');
const variablesCode = `
:root {
  /* Default Tailwind Blue Variables */
  --color-primary-50: 239 246 255;
  --color-primary-100: 219 234 254;
  --color-primary-200: 191 219 254;
  --color-primary-300: 147 197 253;
  --color-primary-400: 96 165 250;
  --color-primary-500: 59 130 246;
  --color-primary-600: 37 99 235;
  --color-primary-700: 29 78 216;
  --color-primary-800: 30 64 175;
  --color-primary-900: 30 58 138;
  --color-primary-950: 23 37 84;
`;
globals = globals.replace(/:root \{/, variablesCode);
fs.writeFileSync('src/app/globals.css', globals, 'utf8');

// 2. UPDATE tailwind.config.js
let tailwind = fs.readFileSync('tailwind.config.js', 'utf8');
const blueOverride = `
      colors: {
        blue: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        v3: {`;
tailwind = tailwind.replace(/colors: \{\s*v3: \{/, blueOverride);
fs.writeFileSync('tailwind.config.js', tailwind, 'utf8');

// 3. UPDATE layout.tsx
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const newLayoutScript = `
              try {
                // FORCE DARK MODE ONLY for V3
                document.documentElement.classList.add('dark');
                
                fetch('/api/theme-settings')
                  .then(res => res.json())
                  .then(settings => {
                    if (!settings || !settings.colorPrimary) return;
                    var root = document.documentElement;
                    
                    function hexToRgb(hex) {
                      var shorthandRegex = /^#?([a-f\\d])([a-f\\d])([a-f\\d])$/i;
                      hex = hex.replace(shorthandRegex, function(m, r, g, b) { return r + r + g + g + b + b; });
                      var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
                      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
                    }

                    var baseRgb = hexToRgb(settings.colorPrimary);
                    if (!baseRgb) return;

                    var mix = function(c1, c2, weight) {
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
                  .catch(console.error);
              } catch (e) {}
`;
layout = layout.replace(/try \{[\s\S]*?\} catch \(e\) \{\}/, newLayoutScript.trim());
fs.writeFileSync('src/app/layout.tsx', layout, 'utf8');

// 4. UPDATE ThemeProvider.tsx
let themeProvider = fs.readFileSync('src/components/providers/ThemeProvider.tsx', 'utf8');
const newApplyTheme = `
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    // V3: Always force dark mode
    root.classList.add('dark');
    setIsDark(true);
    setThemeCookie('dark');

    // Fetch and apply dynamic color
    fetch('/api/theme-settings')
      .then(res => res.json())
      .then(settings => {
        if (!settings || !settings.colorPrimary) return;
        
        function hexToRgb(hex: string) {
          var shorthandRegex = /^#?([a-f\\d])([a-f\\d])([a-f\\d])$/i;
          hex = hex.replace(shorthandRegex, function(m, r, g, b) { return r + r + g + g + b + b; });
          var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
          return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
        }

        var baseRgb = hexToRgb(settings.colorPrimary);
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
themeProvider = themeProvider.replace(/const applyTheme = \(newTheme: Theme\) => \{[\s\S]*?setThemeCookie\(newTheme\);\n  \};/m, newApplyTheme.trim());
fs.writeFileSync('src/components/providers/ThemeProvider.tsx', themeProvider, 'utf8');

