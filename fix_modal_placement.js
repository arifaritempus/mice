const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/requests/edit/[id]/page.tsx', 'utf-8');

// The modal is currently injected in MultiHotelSelect. 
// It starts with "{/* HOTEL RESPONSE MODAL */}" and ends before the second "    </div>\n  );\n}"
const modalStart = code.indexOf("{/* HOTEL RESPONSE MODAL */}");
// Let's just find the closing bracket of the modal. 
// It's easier to use a regex to extract the modal from its current bad position and place it at the end.
const match = code.match(/\{\/\* HOTEL RESPONSE MODAL \*\/\}.*?\}\)/s);
if (match) {
    const modalStr = match[0];
    code = code.replace(modalStr, "");
    
    // Now replace the LAST occurrence of "    </div>\n  );\n}"
    const lastIndex = code.lastIndexOf("    </div>\n  );\n}");
    if (lastIndex !== -1) {
        code = code.substring(0, lastIndex) + modalStr + "\\n    </div>\\n  );\\n}" + code.substring(lastIndex + 17);
        // Wait, substring 17 is wrong because "    </div>\n  );\n}" length is 17. 
        // Let's just do an exact slice.
        code = code.substring(0, lastIndex) + modalStr + "\n    </div>\n  );\n}";
    }
}

fs.writeFileSync('frontend/src/app/requests/edit/[id]/page.tsx', code);
console.log("Moved modal to the end!");
