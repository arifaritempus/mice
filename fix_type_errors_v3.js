const fs = require('fs');

const files = [
  'frontend/src/app/operations/tickets/page.tsx',
  'frontend/src/app/operations/transfers/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /export interface MultiTokenFilterInputProps \{[\s\S]*?\}/,
    `export interface MultiTokenFilterInputProps {
  label?: string;
  tokens: string[];
  inputValue: string;
  suggestions: string[];
  onInputChange: (val: string) => void;
  onAddToken: (token: string) => void;
  onRemoveToken: (token: string) => void;
  rootClassName?: string;
}`
  );

  fs.writeFileSync(file, content);
  console.log("Fixed types again in", file);
}
