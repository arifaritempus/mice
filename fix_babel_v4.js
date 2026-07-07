const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const files = [
  "frontend/src/app/projects/[id]/AccommodationTabOptimized.tsx",
  "frontend/src/app/projects/[id]/DigerTab.tsx",
  "frontend/src/app/projects/[id]/OdemeTab.tsx",
  "frontend/src/app/projects/[id]/TahsilatTab.tsx",
  "frontend/src/app/projects/[id]/TransferTurTab.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  
  let code = fs.readFileSync(file, 'utf8');
  
  if (!code.includes('usePermissions')) {
    code = `import { usePermissions, Module } from "@/lib/permissions";\n` + code;
  }
  
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });
  
  let mainFuncName = null;
  
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      if (t.isFunctionDeclaration(path.node.declaration)) {
        mainFuncName = path.node.declaration.id ? path.node.declaration.id.name : null;
      } else if (t.isIdentifier(path.node.declaration)) {
        mainFuncName = path.node.declaration.name;
      }
    }
  });

  if (!mainFuncName || mainFuncName === 'AccommodationTabOptimized') {
      mainFuncName = file.split('/').pop().replace('.tsx', '');
  }

  traverse(ast, {
    JSXOpeningElement(path) {
      const name = path.node.name.name;
      if (name === 'input' || name === 'select' || name === 'textarea') {
        const hasDisabled = path.node.attributes.some(attr => 
          t.isJSXAttribute(attr) && attr.name.name === 'disabled'
        );
        
        if (!hasDisabled) {
          const closestFuncDecl = path.findParent(p => 
            t.isFunctionDeclaration(p) || 
            t.isFunctionExpression(p) ||
            (t.isVariableDeclarator(p) && t.isArrowFunctionExpression(p.node.init))
          );
          
          let isMain = false;
          if (closestFuncDecl) {
             let name = null;
             if (t.isFunctionDeclaration(closestFuncDecl.node)) name = closestFuncDecl.node.id?.name;
             if (t.isFunctionExpression(closestFuncDecl.node)) name = closestFuncDecl.node.id?.name;
             if (t.isVariableDeclarator(closestFuncDecl.node)) name = closestFuncDecl.node.id?.name;
             
             if (name === mainFuncName) {
                isMain = true;
             }
          }

          if (isMain) {
            const disableExpr = parser.parseExpression(`!permEdit || (compIsLocked && !isSuperAdmin)`);
            path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier('disabled'), t.jsxExpressionContainer(disableExpr)));
          } else {
             path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier('disabled'), t.jsxExpressionContainer(t.identifier('disabled'))));
          }
        }
      }
    },
    
    FunctionDeclaration(path) {
      if (path.node.id && path.node.id.name === mainFuncName) {
         injectHooks(path);
      }
    },
    FunctionExpression(path) {
       if (path.node.id && path.node.id.name === mainFuncName) {
         injectHooks(path);
      }
    }
  });

  function injectHooks(path) {
     let hasPermEdit = false;
     path.traverse({
       VariableDeclarator(vp) {
         if (t.isIdentifier(vp.node.id) && vp.node.id.name === 'permEdit') hasPermEdit = true;
         if (t.isObjectPattern(vp.node.id)) {
           vp.node.id.properties.forEach(prop => {
             if (t.isIdentifier(prop.value) && prop.value.name === 'permEdit') hasPermEdit = true;
           });
         }
       }
     });
     
     const propsParam = path.node.params[0];
     let propsVarName = 'props';
     if (propsParam && t.isIdentifier(propsParam)) {
        propsVarName = propsParam.name;
     } else if (propsParam && t.isObjectPattern(propsParam)) {
         propsVarName = 'arguments[0]';
     }

     if (!hasPermEdit) {
        const hookInjection = parser.parse(`
          const { canEdit, isSuperAdmin } = usePermissions();
          const permEdit = canEdit(Module.PROJECTS);
          const compIsLocked = (${propsVarName} as any)?.isLocked || (${propsVarName} as any)?.project?.locked || false;
        `, { plugins: ['typescript'] }).program.body;
        path.node.body.body.unshift(...hookInjection);
     } else {
        let hasIsSuperAdmin = false;
        path.traverse({
           VariableDeclarator(vp) {
             if (t.isObjectPattern(vp.node.id)) {
               vp.node.id.properties.forEach(prop => {
                 if (t.isIdentifier(prop.value) && prop.value.name === 'isSuperAdmin') hasIsSuperAdmin = true;
               });
             }
           }
        });
        if (!hasIsSuperAdmin) {
            const hookInjection = parser.parse(`
              const { isSuperAdmin } = usePermissions();
              const compIsLocked = (${propsVarName} as any)?.isLocked || (${propsVarName} as any)?.project?.locked || false;
            `, { plugins: ['typescript'] }).program.body;
            path.node.body.body.unshift(...hookInjection);
        }
     }
  }

  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id && path.node.id.name === 'AutocompleteInput') {
         if (path.node.params.length > 0 && t.isObjectPattern(path.node.params[0])) {
            const props = path.node.params[0].properties;
            if (!props.some(p => p.key && p.key.name === 'disabled')) {
              props.push(t.objectProperty(t.identifier('disabled'), t.identifier('disabled'), false, true));
              
              const typeAnnotation = path.node.params[0].typeAnnotation;
              if (typeAnnotation && t.isTSTypeAnnotation(typeAnnotation) && t.isTSTypeLiteral(typeAnnotation.typeAnnotation)) {
                const member = t.tsPropertySignature(t.identifier('disabled'), t.tsTypeAnnotation(t.tsBooleanKeyword()));
                member.optional = true;
                typeAnnotation.typeAnnotation.members.push(member);
              }
            }
         }
      }
    },
    JSXOpeningElement(path) {
      if (path.node.name.name === 'AutocompleteInput') {
         const hasDisabled = path.node.attributes.some(attr => t.isJSXAttribute(attr) && attr.name.name === 'disabled');
         if (!hasDisabled) {
           const disableExpr = parser.parseExpression(`!permEdit || (compIsLocked && !isSuperAdmin)`);
           path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier('disabled'), t.jsxExpressionContainer(disableExpr)));
         }
      }
    }
  });

  const output = generate(ast, {}, code);
  fs.writeFileSync(file, output.code, 'utf8');
  console.log(`Updated ${file}`);
}
