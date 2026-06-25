const fs = require('fs');

let fileContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add `accommodations` to initial state
fileContent = fileContent.replace(
  /hrRows: \[\],/,
  `hrRows: [],\n    accommodations: [],`
);

// 2. Add fetching `project_accommodation_items`
fileContent = fileContent.replace(
  /sup,\n\s*evts,\n\s*\] = await Promise\.all\(\[/,
  `sup,\n        evts,\n        accs,\n      ] = await Promise.all([`
);

fileContent = fileContent.replace(
  /supabase\.from\("project_events_activities"\)\.select\("\*"\),\n\s*\]\);/,
  `supabase.from("project_events_activities").select("*"),\n        supabase.from("project_accommodation_items").select("*"),\n      ]);`
);

fileContent = fileContent.replace(
  /hrRows: hr\.data \|\| \[\],/,
  `hrRows: hr.data || [],\n        accommodations: accs.data || [],`
);

// Add missing variable in useMemo destructuring
fileContent = fileContent.replace(
  /const \{ rpProjectRows, rpSejourRows, collectionPlans, paymentPlans, marketingInteractions, quotes, projects, salesItems, purchaseItems, categories, agencies, sejours, transfers, flights, hrRows, hotels, suppliers, events \} = data;/,
  `const { rpProjectRows, rpSejourRows, collectionPlans, paymentPlans, marketingInteractions, quotes, projects, salesItems, purchaseItems, categories, agencies, sejours, transfers, flights, hrRows, hotels, suppliers, events, accommodations } = data;`
);

fs.writeFileSync('src/app/dashboard/page.tsx', fileContent);
console.log("Updated data fetching in dashboard.");
