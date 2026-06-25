const fs = require('fs');

let file = 'src/app/tickets/options/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '      const hasScopedTerms =\n        voucherTerms.length ||\n        customerTerms.length ||\n        supplierTerms.length ||\n        airlineTerms.length ||\n        routeTerms.length',
  `      const hasScopedTerms =
        voucherTerms.length || voucherInput ||
        customerTerms.length || customerInput ||
        supplierTerms.length || supplierInput ||
        airlineTerms.length || airlineInput ||
        routeTerms.length || routeInput`
);

content = content.replace(
  `        matchesTokens =
          matchesFieldTerms(voucherTerms, [option.voucher_no]) &&
          matchesFieldTerms(customerTerms, [option.agent, option.company_name]) &&
          matchesFieldTerms(supplierTerms, [option.supplier]) &&
          matchesFieldTerms(airlineTerms, [option.airline]) &&
          matchesFieldTerms(routeTerms, [option.route, option.group_ref_no, option.pnr])`,
  `        matchesTokens =
          matchesFieldTerms(voucherInput ? [...voucherTerms, voucherInput] : voucherTerms, [option.voucher_no]) &&
          matchesFieldTerms(customerInput ? [...customerTerms, customerInput] : customerTerms, [option.agent, option.company_name]) &&
          matchesFieldTerms(supplierInput ? [...supplierTerms, supplierInput] : supplierTerms, [option.supplier]) &&
          matchesFieldTerms(airlineInput ? [...airlineTerms, airlineInput] : airlineTerms, [option.airline]) &&
          matchesFieldTerms(routeInput ? [...routeTerms, routeInput] : routeTerms, [option.route, option.group_ref_no, option.pnr])`
);

content = content.replace(
  /    dateRange\.startDate,\n    dateRange\.endDate,\n    flightDateRange\.startDate,\n    flightDateRange\.endDate\n  \]\)/,
  `    dateRange.startDate,
    dateRange.endDate,
    flightDateRange.startDate,
    flightDateRange.endDate,
    voucherInput,
    customerInput,
    supplierInput,
    airlineInput,
    routeInput
  ])`
);

fs.writeFileSync(file, content, 'utf8');
