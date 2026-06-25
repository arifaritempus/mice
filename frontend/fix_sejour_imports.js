const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/services/page.tsx', 'utf8');

if (!content.includes("import { useRouter }")) {
  content = content.replace("import { tr } from 'date-fns/locale';", "import { tr } from 'date-fns/locale';\nimport { useRouter } from 'next/navigation';\nimport { getDayNameShort } from '@/utils/formatters';");
}

if (!content.includes("const router = useRouter();")) {
  content = content.replace("export default function SejourServicesPage() {", "export default function SejourServicesPage() {\n  const router = useRouter();");
}

fs.writeFileSync('src/app/sejour/services/page.tsx', content, 'utf8');
