const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

const themeScript = `
              try {
                var theme = 'dark';
                document.documentElement.classList.add('dark');
                
                // Helper to convert HEX to RGB
                function hexToRgb(hex) {
                  var shorthandRegex = /^#?([a-f\\d])([a-f\\d])([a-f\\d])$/i;
                  hex = hex.replace(shorthandRegex, function(m, r, g, b) { return r + r + g + g + b + b; });
                  var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
                  return result ? parseInt(result[1], 16) + ' ' + parseInt(result[2], 16) + ' ' + parseInt(result[3], 16) : null;
                }

                fetch('/api/theme-settings')
                  .then(res => res.json())
                  .then(settings => {
                    if (!settings) return;
                    var root = document.documentElement;
                    var isDark = root.classList.contains('dark');
                    
                    // Set primary color
                    if (settings.colorPrimary) {
                      var rgb = hexToRgb(settings.colorPrimary);
                      if (rgb) root.style.setProperty('--theme-primary', rgb);
                    }
                    
                    // Set backgrounds based on theme mode
                    if (isDark) {
                      if (settings.darkBgMain) {
                        var rgb = hexToRgb(settings.darkBgMain);
                        if (rgb) root.style.setProperty('--theme-bg-main', rgb);
                      }
                      if (settings.darkCard) {
                        var rgb = hexToRgb(settings.darkCard);
                        if (rgb) root.style.setProperty('--theme-surface', rgb);
                      }
                      if (settings.darkText) {
                        var rgb = hexToRgb(settings.darkText);
                        if (rgb) root.style.setProperty('--theme-text', rgb);
                      }
                      if (settings.darkSidebarBorder) {
                        var rgb = hexToRgb(settings.darkSidebarBorder);
                        if (rgb) root.style.setProperty('--theme-border', rgb);
                      }
                    } else {
                      if (settings.lightBgMain) {
                        var rgb = hexToRgb(settings.lightBgMain);
                        if (rgb) root.style.setProperty('--theme-bg-main', rgb);
                      }
                      if (settings.lightCard) {
                        var rgb = hexToRgb(settings.lightCard);
                        if (rgb) root.style.setProperty('--theme-surface', rgb);
                      }
                      if (settings.lightText) {
                        var rgb = hexToRgb(settings.lightText);
                        if (rgb) root.style.setProperty('--theme-text', rgb);
                      }
                      if (settings.lightSidebarBorder) {
                        var rgb = hexToRgb(settings.lightSidebarBorder);
                        if (rgb) root.style.setProperty('--theme-border', rgb);
                      }
                    }
                  })
                  .catch(console.error);
              } catch (e) {}
`;

code = code.replace(/try \{[\s\S]*?\} catch \(e\) \{\}/, themeScript.trim());
code = code.replace(/backgroundColor: 'var\(--theme-bg-primary\)'/, "backgroundColor: 'rgb(var(--theme-bg-main))'");

fs.writeFileSync('src/app/layout.tsx', code, 'utf8');
