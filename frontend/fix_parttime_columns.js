const fs = require('fs');

let content = fs.readFileSync('src/app/operations/part-time/page.tsx', 'utf8');

const replacements = [
  {
    target: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">\n                      {service.company_name || \'-\'}\n                    </td>',
    replacement: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]" title={service.company_name || \'\'}>\n                      {service.company_name || \'-\'}\n                    </td>'
  },
  {
    target: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">\n                      {service.customer_name || \'-\'}\n                    </td>',
    replacement: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]" title={service.customer_name || \'\'}>\n                      {service.customer_name || \'-\'}\n                    </td>'
  },
  {
    target: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">\n                      {service.hotel_name || \'-\'}\n                    </td>',
    replacement: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[150px]" title={service.hotel_name || \'\'}>\n                      {service.hotel_name || \'-\'}\n                    </td>'
  },
  {
    target: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">\n                      {service.service_type}\n                    </td>',
    replacement: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]" title={service.service_type || \'\'}>\n                      {service.service_type}\n                    </td>'
  },
  {
    target: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">\n                      {service.supplier || \'-\'}\n                    </td>',
    replacement: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]" title={service.supplier || \'\'}>\n                      {service.supplier || \'-\'}\n                    </td>'
  },
  {
    target: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">\n                      {service.employee_name}\n                    </td>',
    replacement: '<td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]" title={service.employee_name || \'\'}>\n                      {service.employee_name}\n                    </td>'
  }
];

let modified = content;
replacements.forEach(({target, replacement}) => {
  modified = modified.replace(target, replacement);
});

fs.writeFileSync('src/app/operations/part-time/page.tsx', modified, 'utf8');
console.log("Columns truncated successfully");
