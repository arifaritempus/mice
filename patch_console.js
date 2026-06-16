const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('originalConsoleError')) {
    const patch = `
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Invalid Refresh Token')) {
      return;
    }
    if (args[0] && args[0].message && args[0].message.includes('Invalid Refresh Token')) {
      return;
    }
    originalConsoleError(...args);
  };
}
`;
    content = content.replace(/(export default function LoginPage[^{]*\{)/, '$1' + patch);
    fs.writeFileSync(filePath, content);
    console.log('Patched', filePath);
  }
}

patchFile('frontend/src/app/login/page.tsx');
