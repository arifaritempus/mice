const fs = require('fs');
const ts = require('typescript');

function removeDateRangeField(filePath) {
  let sourceText = fs.readFileSync(filePath, 'utf8');
  let sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  
  const nodesToRemove = [];
  
  ts.forEachChild(sourceFile, node => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'DateRangeFieldProps') {
      nodesToRemove.push(node);
    }
    if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl && ts.isIdentifier(decl.name)) {
        const name = decl.name.text;
        if (name === 'toDate' || name === 'toIsoDate' || name === 'parseTypedDate') {
          nodesToRemove.push(node);
        }
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === 'DateRangeField') {
      nodesToRemove.push(node);
    }
  });
  
  // Sort descending to not mess up indices
  nodesToRemove.sort((a, b) => b.pos - a.pos);
  
  let result = sourceText;
  for (const node of nodesToRemove) {
    result = result.slice(0, node.pos) + result.slice(node.end);
  }
  
  if (!result.includes("import DateRangeField from '@/components/DateRangeField'")) {
    result = result.replace(/import React/, "import DateRangeField from '@/components/DateRangeField';\nimport React");
  }
  
  fs.writeFileSync(filePath, result);
  console.log('Processed', filePath);
}

removeDateRangeField('frontend/src/app/operations/tickets/page.tsx');
removeDateRangeField('frontend/src/app/operations/transfers/page.tsx');
removeDateRangeField('frontend/src/app/operations/guides/page.tsx');
removeDateRangeField('frontend/src/app/operations/part-time/page.tsx');
