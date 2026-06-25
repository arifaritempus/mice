const fs = require('fs');

let file = 'src/app/tickets/calendar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '      if (searchTokens.length === 0) return true;',
  `      const terms = [...searchTokens, searchQuery.trim()].filter(Boolean);
      if (terms.length === 0) return true;`
);

content = content.replace(
  '      return searchTokens.every(token => ',
  '      return terms.every(token => '
);

const useMemoDepsMatch = content.match(/\[confirmedTickets, searchTokens\]/);
if (useMemoDepsMatch) {
  content = content.replace(
    '[confirmedTickets, searchTokens]',
    '[confirmedTickets, searchTokens, searchQuery]'
  );
}

fs.writeFileSync(file, content, 'utf8');
