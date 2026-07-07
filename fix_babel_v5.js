const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

let code = fs.readFileSync('frontend/src/app/projects/[id]/AccommodationTabOptimized.tsx', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});

traverse(ast, {
  JSXOpeningElement(path) {
    const name = path.node.name.name;
    if (name === 'input' && path.node.attributes.some(a => t.isJSXAttribute(a) && a.name.name === 'disabled')) {
      const closestFuncDecl = path.findParent(p => 
        t.isFunctionDeclaration(p) || t.isFunctionExpression(p) || (t.isVariableDeclarator(p) && t.isArrowFunctionExpression(p.node.init))
      );
      
      console.log('Type:', closestFuncDecl?.node?.type);
      if (t.isFunctionExpression(closestFuncDecl?.node)) {
         console.log('ID:', closestFuncDecl.node.id);
      }
    }
  }
});
