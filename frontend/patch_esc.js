const fs = require('fs');
let content = fs.readFileSync('src/components/ResponsiveDateRangeField.tsx', 'utf8');

const escHookRegex = /(useEffect\(\(\) => \{\s*if \(isMobile\) return;\s*const onClickOutside[\s\S]*?\}\);)/;
const escHookNew = `$1

  // Handle ESC key
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCalendarOpen]);`;
content = content.replace(escHookRegex, escHookNew);

fs.writeFileSync('src/components/ResponsiveDateRangeField.tsx', content, 'utf8');
console.log("Patched ESC key");
