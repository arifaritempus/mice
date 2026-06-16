const fs = require('fs');
let sidebarPath = 'frontend/src/components/Sidebar.tsx';
let sidebar = fs.readFileSync(sidebarPath, 'utf8');

// If already modified, don't break it
if (!sidebar.includes('isMobileOpen')) {
  // Add state
  sidebar = sidebar.replace(/const \[expandedMenus, setExpandedMenus\] = useState<string\[\]>\(\[\]\);/, "const [expandedMenus, setExpandedMenus] = useState<string[]>([]);\n  const [isMobileOpen, setIsMobileOpen] = useState(false);");
  
  // Change layout classes
  sidebar = sidebar.replace(
    /className=\{(["`])(h-full flex flex-col transition-all duration-300 ease-in-out )\$\{([^}]+)\}\s+w-64\s+shadow-2xl\s+overflow-hidden\s+flex-shrink-0(["`])\}/g,
    'className={`fixed md:relative z-[60] top-0 bottom-0 h-[100dvh] md:h-full flex flex-col transition-transform duration-300 ease-in-out ${isCollapsed && !isHovered ? \'md:w-20\' : \'md:w-64\'} w-64 shadow-2xl md:shadow-none overflow-hidden flex-shrink-0 ${isMobileOpen ? \'translate-x-0\' : \'-translate-x-full md:translate-x-0\'}`}'
  );

  // Add mobile overlay
  sidebar = sidebar.replace(
    /return \(\s*<div/,
    'return (\n    <>\n      {/* Mobile Overlay */}\n      {isMobileOpen && (\n        <div \n          className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"\n          onClick={() => setIsMobileOpen(false)}\n        />\n      )}\n      \n      {/* Mobile Top Bar */}\n      <div className="md:hidden flex items-center justify-between p-3 bg-white dark:bg-[#1a2233] border-b border-gray-200 dark:border-white/5 shadow-sm flex-shrink-0 z-40 relative">\n        <div className="flex items-center gap-3">\n          <img src={currentLogo} alt="Logo" className="h-8 w-auto object-contain" />\n        </div>\n        <button \n          onClick={() => setIsMobileOpen(true)}\n          className="p-2 rounded-lg text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"\n        >\n          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>\n        </button>\n      </div>\n\n      <div'
  );

  // Add close button inside sidebar for mobile
  sidebar = sidebar.replace(
    /\{!isCollapsed && \(\s*<button\s*onClick=\{onToggle\}\s*className="absolute -right-3 top-6/,
    '{/* Mobile Close Button */}\n        <button \n          onClick={() => setIsMobileOpen(false)}\n          className="md:hidden absolute top-4 right-4 p-1.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"\n        >\n          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>\n        </button>\n\n        {!isCollapsed && (\n          <button \n            onClick={onToggle}\n            className="hidden md:flex absolute -right-3 top-6'
  );

  // Close fragment
  sidebar = sidebar.replace(/<\/div>\s*$/g, '</div>\n    </>');
  
  fs.writeFileSync(sidebarPath, sidebar);
  console.log("Updated Sidebar.tsx");
}

let authWrapperPath = 'frontend/src/components/AuthWrapper.tsx';
let authWrapper = fs.readFileSync(authWrapperPath, 'utf8');
if (!authWrapper.includes('flex flex-col md:flex-row')) {
  authWrapper = authWrapper.replace(
    /className="flex h-screen transition-colors duration-200"/g,
    'className="flex flex-col md:flex-row h-[100dvh] transition-colors duration-200"'
  );
  fs.writeFileSync(authWrapperPath, authWrapper);
  console.log("Updated AuthWrapper.tsx");
}
