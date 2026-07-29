const ExcelJS = require('./frontend/node_modules/exceljs');
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Test');

sheet.columns = [
  { width: 45 },
  { width: 12 },
  { width: 12 },
  { width: 15 },
  { width: 18 },
  { width: 45 },
];

const imageId = workbook.addImage({
  base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  extension: 'png',
});

sheet.addImage(imageId, {
  tl: { nativeCol: 5, nativeColOff: 2000000, nativeRow: 0, nativeRowOff: 100000 },
  ext: { width: 85, height: 85 },
});

workbook.xlsx.writeFile('test.xlsx').then(() => console.log('Done'));
