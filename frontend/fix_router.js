const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// Add import if not exists
if (!content.includes("import { useRouter } from 'next/navigation';")) {
  content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { useRouter } from 'next/navigation';");
}

// Add router declaration
if (!content.includes('const router = useRouter();')) {
  content = content.replace('export default function SejourPage() {\n', 'export default function SejourPage() {\n  const router = useRouter();\n');
}

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
