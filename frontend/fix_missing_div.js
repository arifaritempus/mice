const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// I might have removed a </div> that closed the top-level flex-1 div!
// Or maybe I forgot to add a closing </div> at the end.
// Let's check the very end of the file.
content = content.replace('      {/* Delete Confirmation Modal */}', '      </div>\n      {/* Delete Confirmation Modal */}');

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
