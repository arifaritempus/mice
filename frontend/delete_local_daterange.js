const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

content = content.replace(/interface DateRangeFieldProps \{[\s\S]*?\}\n/g, '');

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
console.log("Deleted local DateRangeFieldProps");
