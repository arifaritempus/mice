import re

with open('frontend/src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Add state
content = content.replace(
    'const [expandedMenus, setExpandedMenus] = useState<string[]>([]);',
    'const [expandedMenus, setExpandedMenus] = useState<string[]>([]);\n  const [isMobileOpen, setIsMobileOpen] = useState(false);'
)

# Update sidebar container classes
# Original: className={`h-full flex flex-col transition-all duration-300 ease-in-out ${isCollapsed && !isHovered ? 'w-20' : 'w-64'} shadow-2xl overflow-hidden flex-shrink-0 z-50`}
content = re.sub(
    r'className={`h-full flex flex-col transition-all duration-300 ease-in-out \$\{[^}]+\} shadow-2xl overflow-hidden flex-shrink-0 z-50`}',
    'className={`fixed md:relative top-0 bottom-0 left-0 h-[100dvh] md:h-full flex flex-col transition-transform duration-300 ease-in-out ${isCollapsed && !isHovered ? \'md:w-20\' : \'md:w-64\'} w-64 shadow-2xl md:shadow-none overflow-hidden flex-shrink-0 z-50 ${isMobileOpen ? \'translate-x-0\' : \'-translate-x-full md:translate-x-0\'}`}',
    content
)

# Add mobile overlay and hamburger header just before the sidebar div
# We need to find the `return (` statement for the Sidebar
mobile_elements = """
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-3 bg-white dark:bg-[#1a2233] border-b border-gray-200 dark:border-white/5 shadow-sm flex-shrink-0 z-40 relative w-full">
        <div className="flex items-center gap-3">
          <img src={currentLogo} alt="Logo" className="h-8 w-auto object-contain" />
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      <div"""

content = content.replace('return (\n      <div\n        onMouseEnter=', 'return (\n' + mobile_elements + '\n        onMouseEnter=')

# Also replace the single `<div` if the formatting is different
content = content.replace('return (\n    <div\n      onMouseEnter=', 'return (\n' + mobile_elements + '\n      onMouseEnter=')

# We need to wrap the whole return in a fragment, so we need to add `</>` at the end.
content = re.sub(r'</div>\s*\);\s*}\s*$', '</div>\n    </>\n  );\n}', content)


# Hide desktop toggle button on mobile, add mobile close button
mobile_close = """
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {!isCollapsed && (
          <button 
            onClick={onToggle}
            className="hidden md:flex absolute -right-3 top-6"""

content = content.replace(
    '{!isCollapsed && (\n          <button\n            onClick={onToggle}\n            className="absolute -right-3 top-6',
    mobile_close
)

with open('frontend/src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
print("Patched Sidebar.tsx successfully")
