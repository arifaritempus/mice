const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(
  /if \(\(row\.ucus_tipi \|\| row\.ucus_parkuru \|\| row\.havayolu\) && !findSubCat\(\[row\.ucus_tipi, row\.ucus_parkuru, row\.havayolu\], catUcak, "Uçuş Tipi"\)\) addMismatch\("Uçuş Tipi", row\.ucus_tipi \|\| row\.ucus_parkuru \|\| row\.havayolu\);/,
  'if ((row.ucus_ucreti || row.ucus_parkuru) && !findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu], catUcak, "Uçuş Tipi")) addMismatch("Uçuş Tipi", row.ucus_tipi || row.ucus_parkuru || row.havayolu);'
);

code = code.replace(
  /if \(\(row\.ucus_tipi \|\| row\.donus_ucus_parkuru \|\| row\.donus_havayolu\) && !findSubCat\(\[row\.ucus_tipi, row\.donus_ucus_parkuru, row\.donus_havayolu\], catUcak, "Uçuş Tipi"\)\) addMismatch\("Uçuş Tipi", row\.ucus_tipi \|\| row\.donus_ucus_parkuru \|\| row\.donus_havayolu\);/,
  'if ((row.donus_ucus_ucreti || row.donus_ucus_parkuru) && !findSubCat([row.ucus_tipi, row.donus_ucus_parkuru, row.donus_havayolu], catUcak, "Uçuş Tipi")) addMismatch("Uçuş Tipi", row.ucus_tipi || row.donus_ucus_parkuru || row.donus_havayolu);'
);

code = code.replace(
  /if \(\(row\.transfer_arac_tipi \|\| row\.transfer_guzergah\) && !findSubCat\(\[row\.transfer_arac_tipi, ""\], catTransfer, "Transfer Tipi"\)\) addMismatch\("Transfer Tipi", row\.transfer_arac_tipi\);/,
  'if ((row.transfer_ucreti || row.transfer_guzergah) && !findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi")) addMismatch("Transfer Tipi", row.transfer_arac_tipi);'
);

code = code.replace(
  /if \(\(row\.donus_transfer_arac_tipi \|\| row\.donus_transfer_guzergah\) && !findSubCat\(\[row\.donus_transfer_arac_tipi, ""\], catTransfer, "Transfer Tipi"\)\) addMismatch\("Transfer Tipi", row\.donus_transfer_arac_tipi\);/,
  'if ((row.donus_transfer_ucreti || row.donus_transfer_guzergah) && !findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi")) addMismatch("Transfer Tipi", row.donus_transfer_arac_tipi);'
);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
