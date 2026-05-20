require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  try {
    const sejourId = '7e5f0e97-4022-4dc3-816b-178d66fafd16';

    const flightData = [{
      sejour_id: sejourId,
      voucher_number: 'TEST',
      flight_direction: 'departure',
      airline: 'TK',
      flight_number: '123',
      flight_date: '2026-05-20',
      departure_time: null,
      arrival_time: null,
      departure_airport: 'IST',
      arrival_airport: 'AYT',
      ticketing_provider: null,
      ticketing_date: null,
      pnr: null,
      price_per_person: 100,
      total_passengers: 1,
      total_price: 100,
      currency: 'TRY',
      cost_price: 50,
      cost_currency: 'TRY'
    }];

    await client.from('sejour_flights').delete().eq('sejour_id', sejourId);
    let flightsError = (await client.from('sejour_flights').insert(flightData)).error;
    
    if (flightsError && (flightsError.code === '42703' || flightsError.message?.includes('column') || flightsError.message?.includes('does not exist'))) {
      const flightDataWithoutCost = flightData.map((flight) => {
        const { cost_price, cost_currency, ...flightWithoutCost } = flight;
        return flightWithoutCost;
      });
      flightsError = (await client.from('sejour_flights').insert(flightDataWithoutCost)).error;
    }

    if (flightsError) {
      console.error('Flights error:', flightsError);
    } else {
      console.log('Flights inserted successfully');
    }

  } catch(e) {
    console.error("Exception:", e);
  }
}
test();
