const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const files = [
  "frontend/src/app/projects/[id]/AccommodationTabOptimized.tsx",
  "frontend/src/app/projects/[id]/DigerTab.tsx",
  "frontend/src/app/projects/[id]/FinancialTab.tsx",
  "frontend/src/app/projects/[id]/NotesTab.tsx",
  "frontend/src/app/projects/[id]/OdemeTab.tsx",
  "frontend/src/app/projects/[id]/TahsilatTab.tsx",
  "frontend/src/app/projects/[id]/TransferTurTab.tsx",
  "frontend/src/app/projects/[id]/UcakBiletiTab.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  
  console.log(`Processing ${file}...`);
  let code = fs.readFileSync(file, 'utf8');
  
  // First, ensure usePermissions is imported
  if (!code.includes('usePermissions')) {
    code = `import { usePermissions, Module } from "@/lib/permissions";\n` + code;
  }
  
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });
    
    let isMainComponent = false;
    let mainComponentPath = null;
    
    traverse(ast, {
      ExportDefaultDeclaration(path) {
        if (t.isFunctionDeclaration(path.node.declaration)) {
          mainComponentPath = path.get('declaration');
        }
      },
      JSXOpeningElement(path) {
        const name = path.node.name.name;
        if (name === 'input' || name === 'select' || name === 'textarea') {
          // Check if disabled already exists
          const hasDisabled = path.node.attributes.some(attr => 
            t.isJSXAttribute(attr) && attr.name.name === 'disabled'
          );
          
          if (!hasDisabled) {
            // Find if this is inside AutocompleteInput or another nested function
            let parentFunc = path.findParent(p => t.isFunctionDeclaration(p) || t.isArrowFunctionExpression(p));
            let isInner = false;
            if (parentFunc && parentFunc.node.id && parentFunc.node.id.name === 'AutocompleteInput') {
              isInner = true;
            }
            
            // disabled={!permEdit || (isLocked && !isSuperAdmin)}
            let disableExpr = t.logicalExpression(
              '||',
              t.unaryExpression('!', t.identifier('permEdit')),
              t.logicalExpression(
                '&&',
                t.identifier('isLocked'),
                t.unaryExpression('!', t.identifier('isSuperAdmin'))
              )
            );
            
            if (isInner) {
              disableExpr = t.identifier('disabled');
            }
            
            path.node.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier('disabled'),
                t.jsxExpressionContainer(disableExpr)
              )
            );
          }
        }
      }
    });
    
    // Inject hook into main component
    if (mainComponentPath) {
      const body = mainComponentPath.node.body.body;
      const hookInjection = parser.parse(`
        const { canEdit, isSuperAdmin } = usePermissions();
        const permEdit = canEdit(Module.PROJECTS);
      `).program.body;
      
      body.unshift(...hookInjection);
    }
    
    // Fix AutocompleteInput to accept disabled prop
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id && path.node.id.name === 'AutocompleteInput') {
          // It takes an object param
          if (path.node.params.length > 0 && t.isObjectPattern(path.node.params[0])) {
            const props = path.node.params[0].properties;
            if (!props.some(p => p.key && p.key.name === 'disabled')) {
              props.push(
                t.objectProperty(
                  t.identifier('disabled'),
                  t.identifier('disabled'),
                  false,
                  true // shorthand
                )
              );
            }
            
            // Add to TS type if it exists
            const typeAnnotation = path.node.params[0].typeAnnotation;
            if (typeAnnotation && t.isTSTypeAnnotation(typeAnnotation)) {
              if (t.isTSTypeLiteral(typeAnnotation.typeAnnotation)) {
                typeAnnotation.typeAnnotation.members.push(
                  t.tsPropertySignature(
                    t.identifier('disabled'),
                    t.tsTypeAnnotation(t.tsBooleanKeyword())
                  )
                );
                // Make it optional
                typeAnnotation.typeAnnotation.members[typeAnnotation.typeAnnotation.members.length-1].optional = true;
              }
            }
          }
        }
      },
      JSXOpeningElement(path) {
        if (path.node.name.name === 'AutocompleteInput') {
           const hasDisabled = path.node.attributes.some(attr => 
            t.isJSXAttribute(attr) && attr.name.name === 'disabled'
          );
          if (!hasDisabled) {
             const disableExpr = t.logicalExpression(
              '||',
              t.unaryExpression('!', t.identifier('permEdit')),
              t.logicalExpression(
                '&&',
                t.identifier('isLocked'),
                t.unaryExpression('!', t.identifier('isSuperAdmin'))
              )
            );
            path.node.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier('disabled'),
                t.jsxExpressionContainer(disableExpr)
              )
            );
          }
        }
      }
    });
    
    const output = generate(ast, {}, code);
    fs.writeFileSync(file, output.code, 'utf8');
    console.log(`Successfully updated ${file}`);
    
  } catch (err) {
    console.error(`Failed to parse ${file}:`, err);
  }
}
