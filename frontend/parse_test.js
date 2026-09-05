const XLSX = require('exceljs');
async function run() {
  const wb = new XLSX.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(["KATILIMCI BİLGİLERİ"]);
  ws.addRow(["NO", "İSİM", "SOYİSİM"]);
  ws.addRow([, "Ahmet", "Yılmaz"]);
  console.log(ws.getRow(3).values);
}
run();
