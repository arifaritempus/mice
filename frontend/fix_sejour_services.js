const fs = require('fs');

let file = 'src/app/sejour/services/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "        filteredServices = filteredServices.filter(s => includesByTokens(s.voucherNumber, activeTab === 'sales' ? salesVoucherTokens : costVoucherTokens));",
  `        filteredServices = filteredServices.filter(s => includesByTokens(s.voucherNumber, activeTab === 'sales' ? [...salesVoucherTokens, salesVoucherInput.trim()].filter(Boolean) : [...costVoucherTokens, costVoucherInput.trim()].filter(Boolean)));`
);

// We need to add salesVoucherInput and costVoucherInput to the dependency arrays.
const depsToFix = [
  /    salesVoucherTokens, salesCustomerTokens, salesHotelTokens, salesGuestTokens,/g
];

depsToFix.forEach(regex => {
  content = content.replace(regex, '    salesVoucherTokens, salesVoucherInput, salesCustomerTokens, salesHotelTokens, salesGuestTokens,');
});

// For cost arrays we also need costVoucherInput
content = content.replace(
  /    costVoucherTokens, costCustomerTokens, costHotelTokens, costGuestTokens,/g,
  '    costVoucherTokens, costVoucherInput, costCustomerTokens, costHotelTokens, costGuestTokens,'
);

// We also need to fix includesByTokens usage for customer, hotel, guest.
content = content.replace(
  "        filteredServices = filteredServices.filter(s => includesByTokens(s.customer, activeTab === 'sales' ? salesCustomerTokens : costCustomerTokens));",
  `        filteredServices = filteredServices.filter(s => includesByTokens(s.customer, activeTab === 'sales' ? [...salesCustomerTokens, salesCustomerInput.trim()].filter(Boolean) : [...costCustomerTokens, costCustomerInput.trim()].filter(Boolean)));`
);

content = content.replace(
  "        filteredServices = filteredServices.filter(s => includesByTokens(s.hotel, activeTab === 'sales' ? salesHotelTokens : costHotelTokens));",
  `        filteredServices = filteredServices.filter(s => includesByTokens(s.hotel, activeTab === 'sales' ? [...salesHotelTokens, salesHotelInput.trim()].filter(Boolean) : [...costHotelTokens, costHotelInput.trim()].filter(Boolean)));`
);

content = content.replace(
  "        filteredServices = filteredServices.filter(s => includesByTokens(s.guestInfo, activeTab === 'sales' ? salesGuestTokens : costGuestTokens));",
  `        filteredServices = filteredServices.filter(s => includesByTokens(s.guestInfo, activeTab === 'sales' ? [...salesGuestTokens, salesGuestInput.trim()].filter(Boolean) : [...costGuestTokens, costGuestInput.trim()].filter(Boolean)));`
);

// Add missing Input deps to useEffects/useMemos
content = content.replace(
  /    salesCustomerTokens, salesHotelTokens, salesGuestTokens,/g,
  '    salesCustomerTokens, salesCustomerInput, salesHotelTokens, salesHotelInput, salesGuestTokens, salesGuestInput,'
);
content = content.replace(
  /    costCustomerTokens, costHotelTokens, costGuestTokens,/g,
  '    costCustomerTokens, costCustomerInput, costHotelTokens, costHotelInput, costGuestTokens, costGuestInput,'
);

fs.writeFileSync(file, content, 'utf8');
