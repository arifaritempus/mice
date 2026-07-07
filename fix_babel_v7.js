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
    if (name === 'input') {
      const closestFuncDecl = path.findParent(p => {
        if (!p.node) return false;
        return t.isFunctionDeclaration(p.node) || t.isFunctionExpression(p.node) || (t.isVariableDeclarator(p.node) && t.isArrowFunctionExpression(p.node.init));
      });
      let foundName = 'none';
      if (closestFuncDecl) {
         if (t.isFunctionDeclaration(closestFuncDecl.node)) foundName = closestFuncDecl.node.id?.name;
         if (t.isFunctionExpression(closestFuncDecl.node)) foundName = closestFuncDecl.node.id?.name;
         if (t.isVariableDeclarator(closestFuncDecl.node)) foundName = closestFuncDecl.node.id?.name;
      }
      console.log('Input line:', path.node.loc.start.line, 'Closest func name:', foundName);
    }
  }
});
