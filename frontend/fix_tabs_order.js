const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

// 1. Fix TABS array
const targetTabs = `const TABS: TabDef[] = [
  { key: "konaklama", label: "KONAKLAMA" },
  { key: "ucak-bileti", label: "UÇAK BİLETİ" },
  { key: "transfer-tur", label: "TRANSFER & TUR" },
  { key: "diger", label: "DİĞER" },
  { key: "alis", label: "ALIŞ" },
  { key: "tahsilat", label: "TAHSİLAT" },
  { key: "odeme", label: "ÖDEME" },
  { key: "kar-zarar", label: "KAR/ZARAR" },
];`;

const newTabs = `const TABS: TabDef[] = [
  { key: "satis", label: "SATIŞ" },
  { key: "alis", label: "ALIŞ" },
  { key: "konaklama", label: "KONAKLAMA" },
  { key: "ucak-bileti", label: "UÇAK BİLETİ" },
  { key: "transfer-tur", label: "TRANSFER & TUR" },
  { key: "diger", label: "DİĞER" },
  { key: "tahsilat", label: "TAHSİLAT" },
  { key: "odeme", label: "ÖDEME" },
  { key: "kar-zarar", label: "KAR/ZARAR" },
];`;

if (code.includes(targetTabs)) {
    code = code.replace(targetTabs, newTabs);
    console.log("Fixed TABS array");
} else {
    console.log("Could not find TABS array target");
}

// 2. Fix Kongre tabs array
const targetKongreTabs = `            ? [
                { key: "kongre-katilimcilar", label: "KATILIMCILAR" },
                { key: "kongre-odalama", label: "BLOKAJ" },
                { key: "kongre-sponsorlar", label: "SPONSORLAR" },
                { key: "konaklama", label: "KONAKLAMA" },
                { key: "ucak-bileti", label: "UÇAK BİLETİ" },
                { key: "transfer-tur", label: "TRANSFER & TUR" },
                { key: "diger", label: "DİĞER" },
                { key: "kongre-finans", label: "PROFORMA" },
                { key: "alis", label: "ALIŞ" },
                { key: "tahsilat", label: "TAHSİLAT" },
                { key: "odeme", label: "ÖDEME" },
                { key: "kar-zarar", label: "KAR/ZARAR" }
              ]`;

const newKongreTabs = `            ? [
                { key: "kongre-katilimcilar", label: "KATILIMCILAR" },
                { key: "kongre-odalama", label: "BLOKAJ" },
                { key: "kongre-sponsorlar", label: "SPONSORLAR" },
                { key: "satis", label: "SATIŞ" },
                { key: "alis", label: "ALIŞ" },
                { key: "konaklama", label: "KONAKLAMA" },
                { key: "ucak-bileti", label: "UÇAK BİLETİ" },
                { key: "transfer-tur", label: "TRANSFER & TUR" },
                { key: "diger", label: "DİĞER" },
                { key: "kongre-finans", label: "PROFORMA" },
                { key: "tahsilat", label: "TAHSİLAT" },
                { key: "odeme", label: "ÖDEME" },
                { key: "kar-zarar", label: "KAR/ZARAR" }
              ]`;

if (code.includes(targetKongreTabs)) {
    code = code.replace(targetKongreTabs, newKongreTabs);
    console.log("Fixed Kongre tabs array");
} else {
    console.log("Could not find Kongre tabs array target");
}

fs.writeFileSync('src/app/projects/[id]/page.tsx', code);
