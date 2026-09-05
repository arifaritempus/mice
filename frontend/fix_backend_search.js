const fs = require('fs');
const filePath = '../backend/src/routes/operations.js';
let code = fs.readFileSync(filePath, 'utf8');

const target = `    const buildHaystack = (row) =>
      [
        row.reference,
        row.project_reference,
        row.customer_name,
        row.company_name,
        row.supplier_name,
        row.departure_point,
        row.arrival_point,
        row.transfer_type,
        row.service_type,
        row.vehicle_type,
        row.transfer_date,
        row.transfer_time,
        row.currency,
        row.notes,
        row.hotel_name,
        row.flight_info?.flight_number,
        row.flight_info?.airline,
        row.flight_info?.departure_airport,
        row.flight_info?.arrival_airport
      ]`;

const replacement = `    const buildHaystack = (row) =>
      [
        row.reference,
        row.project_reference,
        row.customer_name,
        row.company_name,
        row.supplier_name,
        row.departure_point,
        row.arrival_point,
        row.route,
        row.transfer_type,
        row.service_type,
        row.vehicle_type,
        row.transfer_date,
        row.transfer_time,
        row.currency,
        row.notes,
        ...(Array.isArray(row.passengers) ? row.passengers : [row.passengers]),
        row.hotel_name,
        row.flight_info?.flight_number,
        row.flight_info?.airline,
        row.flight_info?.departure_airport,
        row.flight_info?.arrival_airport,
        row.total_amount,
        row.price,
        row.cost_amount,
        row.cost_price
      ]`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Fixed operations search haystack");
} else {
    console.log("Could not find target haystack");
}
