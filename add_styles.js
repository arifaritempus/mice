const fs = require('fs');

const dateRangeFieldPath = 'frontend/src/components/DateRangeField.tsx';
const responsiveDateRangeFieldPath = 'frontend/src/components/ResponsiveDateRangeField.tsx';

let drfContent = fs.readFileSync(dateRangeFieldPath, 'utf8');
let rdrfContent = fs.readFileSync(responsiveDateRangeFieldPath, 'utf8');

// Extract the <style> block from DateRangeField
const styleRegex = /{isCalendarOpen && typeof document !== 'undefined' && createPortal\([\s\S]*?<style dangerouslySetInnerHTML=\{\{__html: \`([\s\S]*?)\`\}\} \/>/m;

// Wait, the style block is just:
// <style dangerouslySetInnerHTML={{__html: ` ... `}} />
const exactStyleRegex = /<style dangerouslySetInnerHTML=\{\{__html: \`([\s\S]*?)\`\}\} \/>/;
const match = drfContent.match(exactStyleRegex);

if (match) {
  const styleBlock = `      {/* Inject some simple custom CSS for datepicker to make it match tailwind dark mode */}
      <style dangerouslySetInnerHTML={{__html: \`${match[1]}\`}} />`;
  
  // Insert it before the closing </div> of ResponsiveDateRangeField
  if (!rdrfContent.includes('<style dangerouslySetInnerHTML')) {
    rdrfContent = rdrfContent.replace(/(<\/div>\s*)$/, `${styleBlock}\n    $1`);
    
    // Also, make sure calendarClassName has 'custom-datepicker-theme' in ResponsiveDateRangeField
    rdrfContent = rdrfContent.replace(/calendarClassName="!border-0 !bg-transparent w-full max-w-sm mx-auto"/, 'calendarClassName="!border-0 !bg-transparent custom-datepicker-theme w-full max-w-sm mx-auto"');
    rdrfContent = rdrfContent.replace(/calendarClassName="!border-none !bg-transparent dark:!text-white"/, 'calendarClassName="!border-none !bg-transparent custom-datepicker-theme dark:!text-white"');

    fs.writeFileSync(responsiveDateRangeFieldPath, rdrfContent);
    console.log('Added styles successfully.');
  } else {
    console.log('Styles already exist.');
  }
} else {
  console.log('Could not find style block in DateRangeField.tsx');
}
