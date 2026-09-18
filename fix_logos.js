const fs = require('fs');

const files = [
  'frontend/src/app/quotes/view/[id]/page.tsx',
  'frontend/src/app/projects/view/[id]/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Fix loginLogo variable (we'll just remove it or ignore it, and replace the JSX)
  content = content.replace(
    /\{loginLogo && \([\s\S]*?<img[\s\S]*?src=\{loginLogo\}[\s\S]*?\/>\s*\)\}/,
    `{appSettings && (
              <>
                <img
                  src={appSettings?.lightMenuLogo || appSettings?.lightIconLogo || "/LOGO_NAVY.png"}
                  alt="Logo"
                  className="h-24 w-auto object-contain drop-shadow-2xl transition-all duration-700 dark:hidden"
                />
                <img
                  src={appSettings?.darkMenuLogo || appSettings?.darkIconLogo || "/LOGO_OFFWHITE.png"}
                  alt="Logo"
                  className="h-24 w-auto object-contain drop-shadow-2xl transition-all duration-700 hidden dark:block"
                />
              </>
            )}`
  );

  // 2. Fix the header
  content = content.replace(
    /className="p-6 flex flex-wrap justify-between items-center gap-4 transition-colors duration-500"\s*style=\{\{ backgroundColor: "#232f38" \}\}/g,
    `className="p-6 flex flex-wrap justify-between items-center gap-4 transition-colors duration-500 bg-white dark:bg-[#232f38] border-b border-gray-200 dark:border-white/10"`
  );

  // 3. Fix the header logo and text
  content = content.replace(
    /\{\(appSettings\?\.darkIconLogo \|\| appSettings\?\.lightIconLogo\) && \([\s\S]*?<img[\s\S]*?src=\{appSettings\?\.darkIconLogo \|\| appSettings\?\.lightIconLogo\}[\s\S]*?\/>\s*\)\}\s*<span className="text-white text-lg font-bold tracking-tight">/g,
    `{appSettings && (
              <>
                <img
                  src={appSettings?.lightMenuLogo || appSettings?.lightIconLogo || "/LOGO_NAVY.png"}
                  alt="Logo"
                  className="h-10 w-auto dark:hidden"
                />
                <img
                  src={appSettings?.darkMenuLogo || appSettings?.darkIconLogo || "/LOGO_OFFWHITE.png"}
                  alt="Logo"
                  className="h-10 w-auto hidden dark:block"
                />
              </>
            )}
            <span className="text-gray-900 dark:text-white text-lg font-bold tracking-tight">`
  );

  fs.writeFileSync(file, content);
  console.log("Updated", file);
});
