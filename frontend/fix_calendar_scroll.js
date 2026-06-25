const fs = require('fs');

let content = fs.readFileSync('src/app/tickets/calendar/page.tsx', 'utf8');

const oldWrapperStart = '<div className="h-[calc(100vh-2rem)] flex flex-col p-4 lg:p-6 overflow-hidden bg-transparent font-sans text-white w-full">';
const newWrapperStart = '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">\n      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-2">';

content = content.replace(oldWrapperStart, newWrapperStart);

// Now we need to add the extra closing div before the styles or at the end of the return
const oldEnd = '      <style jsx global>{`';
const newEnd = '      </div>\n      <style jsx global>{`';

content = content.replace(oldEnd, newEnd);

fs.writeFileSync('src/app/tickets/calendar/page.tsx', content, 'utf8');
console.log("Scroll wrappers updated.");
