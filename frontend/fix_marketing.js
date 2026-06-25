const fs = require('fs');

let file = 'src/app/marketing/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Clients Filter
content = content.replace(
  '      const matchesSearch = (!globalSearchTerm || searchStr.includes(globalSearchTerm.toLowerCase())) &&\n        (searchTokens.length === 0 || searchTokens.every(token => searchStr.includes(token.toLowerCase())));',
  `      const terms = [...searchTokens, globalSearchTerm.trim()].filter(Boolean);
      const matchesSearch = terms.length === 0 || terms.every(token => searchStr.includes(token.toLowerCase()));`
);

content = content.replace(
  '  }, [clients, globalSearchTerm, clientTypeFilter]);',
  '  }, [clients, globalSearchTerm, searchTokens, clientTypeFilter]);'
);

// Interactions Filter
content = content.replace(
  '      const searchStr = [interaction.marketing_clients?.name, interaction.description, interaction.type].filter(Boolean).join(\' \').toLowerCase();\n      const matchesSearch = (!globalSearchTerm || searchStr.includes(globalSearchTerm.toLowerCase())) &&\n        (searchTokens.length === 0 || searchTokens.every(token => searchStr.includes(token.toLowerCase())));',
  `      const searchStr = [interaction.marketing_clients?.name, interaction.description, interaction.type].filter(Boolean).join(' ').toLowerCase();
      const terms = [...searchTokens, globalSearchTerm.trim()].filter(Boolean);
      const matchesSearch = terms.length === 0 || terms.every(token => searchStr.includes(token.toLowerCase()));`
);

content = content.replace(
  '  }, [interactions, startDate, endDate, globalSearchTerm]);',
  '  }, [interactions, startDate, endDate, globalSearchTerm, searchTokens]);'
);

fs.writeFileSync(file, content, 'utf8');
