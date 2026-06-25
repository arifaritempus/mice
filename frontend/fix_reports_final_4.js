const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// The `</div>` at line 825 closes the inner wrapper! We need to delete it!
// Let's find it. It's right before `<datalist id="report-hotels-list">`
code = code.replace(
  "        </div>\n      </div>\n\n      <datalist id=\"report-hotels-list\">",
  "        </div>\n\n      <datalist id=\"report-hotels-list\">"
);

// We need to restore the `</div>` at the end of the file!
// Since we removed the inner wrapper opening tag, and NOW we removed the inner wrapper closing tag,
// the file ends with:
//       <style jsx global>{`...`}</style>
//     </div>
//   );
// }
// This is exactly ONE `</div>` at the end. My previous script replaced TWO `</div>` with ONE `</div>`.
// Wait, my previous script ALREADY replaced TWO with ONE. So the end of the file is currently ONE `</div>`.
// Which is correct, since we only have `newMainWrapper` opening!

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log("Deleted inner wrapper closing tag.");
