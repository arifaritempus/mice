const fs = require('fs');

let file = 'src/app/operations/guides/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  const scopedSearchState = useMemo(\n    () => JSON.stringify({ voucherTerms, customerTerms, hotelTerms, supplierTerms, guideTerms }),\n    [voucherTerms, customerTerms, hotelTerms, supplierTerms, guideTerms]\n  );',
  `  const scopedSearchState = useMemo(
    () => JSON.stringify({
      voucherTerms: voucherInput ? [...voucherTerms, voucherInput] : voucherTerms,
      customerTerms: customerInput ? [...customerTerms, customerInput] : customerTerms,
      hotelTerms: hotelInput ? [...hotelTerms, hotelInput] : hotelTerms,
      supplierTerms: supplierInput ? [...supplierTerms, supplierInput] : supplierTerms,
      guideTerms: guideInput ? [...guideTerms, guideInput] : guideTerms
    }),
    [voucherTerms, voucherInput, customerTerms, customerInput, hotelTerms, hotelInput, supplierTerms, supplierInput, guideTerms, guideInput]
  );`
);

content = content.replace(
  `        voucherTerms: JSON.stringify(voucherTerms),
        customerTerms: JSON.stringify(customerTerms),
        hotelTerms: JSON.stringify(hotelTerms),
        supplierTerms: JSON.stringify(supplierTerms),
        guideTerms: JSON.stringify(guideTerms)`,
  `        voucherTerms: JSON.stringify(voucherInput ? [...voucherTerms, voucherInput] : voucherTerms),
        customerTerms: JSON.stringify(customerInput ? [...customerTerms, customerInput] : customerTerms),
        hotelTerms: JSON.stringify(hotelInput ? [...hotelTerms, hotelInput] : hotelTerms),
        supplierTerms: JSON.stringify(supplierInput ? [...supplierTerms, supplierInput] : supplierTerms),
        guideTerms: JSON.stringify(guideInput ? [...guideTerms, guideInput] : guideTerms)`
);

fs.writeFileSync(file, content, 'utf8');
