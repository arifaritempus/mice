const fs = require("fs");

// Dosyayı oku
let content = fs.readFileSync("page.tsx", "utf8");

// Sütun eşleştirmesini düzelt
content = content.replace(
  /rowData\.tarih_11 = getDateCellValue\(row\.getCell\(14\)\);.*?\/\/ N sütunu.*?\n/g,
  "rowData.tarih_11 = getDateCellValue(row.getCell(16));  // P sütunu - 1. TARİH\n",
);

content = content.replace(
  /rowData\.tarih_12 = getDateCellValue\(row\.getCell\(15\)\);.*?\/\/ O sütunu.*?\n/g,
  "rowData.tarih_12 = getDateCellValue(row.getCell(17));  // Q sütunu - 2. TARİH\n",
);

content = content.replace(
  /rowData\.tarih_13 = getDateCellValue\(row\.getCell\(16\)\);.*?\/\/ P sütunu.*?\n/g,
  "rowData.tarih_13 = getDateCellValue(row.getCell(18));  // R sütunu - 3. TARİH\n",
);

content = content.replace(
  /rowData\.tarih_14 = getDateCellValue\(row\.getCell\(17\)\);.*?\/\/ Q sütunu.*?\n/g,
  "rowData.tarih_14 = getDateCellValue(row.getCell(19));  // S sütunu - 4. TARİH\n",
);

content = content.replace(
  /rowData\.tarih_15 = getDateCellValue\(row\.getCell\(18\)\);.*?\/\/ R sütunu.*?\n/g,
  "rowData.tarih_15 = getDateCellValue(row.getCell(20));  // T sütunu - 5. TARİH\n",
);

// Kalan sütunları da düzelt
content = content.replace(
  /rowData\.geceli = getCellValue\(row\.getCell\(19\)\);.*?\n/g,
  "rowData.geceli = getCellValue(row.getCell(21));        // U sütunu - 6. TARİH\n",
);

content = content.replace(
  /rowData\.paket = getCellValue\(row\.getCell\(20\)\);.*?\n/g,
  "rowData.paket = getCellValue(row.getCell(22));         // V sütunu - 7. TARİH\n",
);

content = content.replace(
  /rowData\.otel = getCellValue\(row\.getCell\(21\)\);.*?\n/g,
  "rowData.otel = getCellValue(row.getCell(23));          // W sütunu - GECELEME\n",
);

content = content.replace(
  /rowData\.ucak = getCellValue\(row\.getCell\(22\)\);.*?\n/g,
  "rowData.ucak = getCellValue(row.getCell(24));          // X sütunu - PAKET\n",
);

content = content.replace(
  /rowData\.toplam = getCellValue\(row\.getCell\(23\)\);.*?\n/g,
  "rowData.toplam = getCellValue(row.getCell(25));        // Y sütunu - OTEL\n",
);

content = content.replace(
  /rowData\.doviz = getCellValue\(row\.getCell\(24\)\);.*?\n/g,
  "rowData.doviz = getCellValue(row.getCell(26));         // Z sütunu - UÇAK\n",
);

content = content.replace(
  /rowData\.ekstra1 = getCellValue\(row\.getCell\(25\)\);.*?\n/g,
  "rowData.ekstra1 = getCellValue(row.getCell(27));       // AA sütunu - TOPLAM\n",
);

content = content.replace(
  /rowData\.ekstra2 = getCellValue\(row\.getCell\(26\)\);.*?\n/g,
  "rowData.ekstra2 = getCellValue(row.getCell(28));       // AB sütunu - DÖVİZ\n",
);

// Gereksiz ekstra3 ve ekstra4'ü kaldır
content = content.replace(
  /rowData\.ekstra3 = getCellValue\(row\.getCell\(27\)\);.*?\n/g,
  "",
);

content = content.replace(
  /rowData\.ekstra4 = getCellValue\(row\.getCell\(28\)\);.*?\n/g,
  "",
);

// Dosyayı yaz
fs.writeFileSync("page.tsx", content);

console.log("Sütun eşleştirmesi düzeltildi!");
