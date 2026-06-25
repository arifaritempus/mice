const fs = require('fs');

let file = 'src/app/operations/part-time/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  const scopedSearchState = useMemo(\n    () => JSON.stringify({ voucherTerms, customerTerms, hotelTerms, supplierTerms, employeeTerms }),\n    [voucherTerms, customerTerms, hotelTerms, supplierTerms, employeeTerms]\n  );',
  `  const scopedSearchState = useMemo(
    () => JSON.stringify({
      voucherTerms: voucherInput ? [...voucherTerms, voucherInput] : voucherTerms,
      customerTerms: customerInput ? [...customerTerms, customerInput] : customerTerms,
      hotelTerms: hotelInput ? [...hotelTerms, hotelInput] : hotelTerms,
      supplierTerms: supplierInput ? [...supplierTerms, supplierInput] : supplierTerms,
      employeeTerms: employeeInput ? [...employeeTerms, employeeInput] : employeeTerms
    }),
    [voucherTerms, voucherInput, customerTerms, customerInput, hotelTerms, hotelInput, supplierTerms, supplierInput, employeeTerms, employeeInput]
  );`
);

content = content.replace(
  `        voucherTerms: JSON.stringify(voucherTerms),
        customerTerms: JSON.stringify(customerTerms),
        hotelTerms: JSON.stringify(hotelTerms),
        supplierTerms: JSON.stringify(supplierTerms),
        employeeTerms: JSON.stringify(employeeTerms)`,
  `        voucherTerms: JSON.stringify(voucherInput ? [...voucherTerms, voucherInput] : voucherTerms),
        customerTerms: JSON.stringify(customerInput ? [...customerTerms, customerInput] : customerTerms),
        hotelTerms: JSON.stringify(hotelInput ? [...hotelTerms, hotelInput] : hotelTerms),
        supplierTerms: JSON.stringify(supplierInput ? [...supplierTerms, supplierInput] : supplierTerms),
        employeeTerms: JSON.stringify(employeeInput ? [...employeeTerms, employeeInput] : employeeTerms)`
);

fs.writeFileSync(file, content, 'utf8');
