const mammoth = require("mammoth");
const fs = require("fs");
mammoth.extractRawText({path: "../sozleme.docx"})
    .then(function(result) {
        fs.writeFileSync("../sozlesme_clean.txt", result.value);
    })
    .catch(console.error);
