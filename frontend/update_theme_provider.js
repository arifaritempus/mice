const fs = require('fs');
let code = fs.readFileSync('src/components/providers/ThemeProvider.tsx', 'utf8');

// We need to inject the fetch and CSS var logic into applyTheme
const injectCode = `
    if (newTheme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setIsDark(systemTheme === 'dark');
      applyCustomColors(systemTheme === 'dark');
    } else {
      root.classList.add(newTheme);
      setIsDark(newTheme === 'dark');
      applyCustomColors(newTheme === 'dark');
    }
`;

const colorFn = `
  const applyCustomColors = (isDarkMode: boolean) => {
    fetch('/api/theme-settings')
      .then(res => res.json())
      .then(settings => {
        if (!settings) return;
        const root = document.documentElement;
        
        function hexToRgb(hex) {
          if (!hex) return null;
          var shorthandRegex = /^#?([a-f\\d])([a-f\\d])([a-f\\d])$/i;
          hex = hex.replace(shorthandRegex, function(m, r, g, b) { return r + r + g + g + b + b; });
          var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
          return result ? parseInt(result[1], 16) + ' ' + parseInt(result[2], 16) + ' ' + parseInt(result[3], 16) : null;
        }

        if (settings.colorPrimary) {
          const rgb = hexToRgb(settings.colorPrimary);
          if (rgb) root.style.setProperty('--theme-primary', rgb);
        }

        if (isDarkMode) {
          if (settings.darkBgMain) root.style.setProperty('--theme-bg-main', hexToRgb(settings.darkBgMain));
          if (settings.darkCard) root.style.setProperty('--theme-surface', hexToRgb(settings.darkCard));
          if (settings.darkText) root.style.setProperty('--theme-text', hexToRgb(settings.darkText));
          if (settings.darkSidebarBorder) root.style.setProperty('--theme-border', hexToRgb(settings.darkSidebarBorder));
        } else {
          if (settings.lightBgMain) root.style.setProperty('--theme-bg-main', hexToRgb(settings.lightBgMain));
          if (settings.lightCard) root.style.setProperty('--theme-surface', hexToRgb(settings.lightCard));
          if (settings.lightText) root.style.setProperty('--theme-text', hexToRgb(settings.lightText));
          if (settings.lightSidebarBorder) root.style.setProperty('--theme-border', hexToRgb(settings.lightSidebarBorder));
        }
      })
      .catch(() => {});
  };
`;

code = code.replace(/if \(newTheme === 'system'\) \{[\s\S]*?\} else \{[\s\S]*?\}/, injectCode.trim());
code = code.replace(/const applyTheme = \(newTheme: Theme\) => \{/, colorFn + '\n  const applyTheme = (newTheme: Theme) => {');

fs.writeFileSync('src/components/providers/ThemeProvider.tsx', code, 'utf8');
