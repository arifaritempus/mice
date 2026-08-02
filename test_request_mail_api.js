const data = {
  to: "hello@codeicon.co",
  subject: "Test Mail",
  requestData: {
    reference: "123",
    company_name: "Test Company",
    date_range: "01.01.2024 - 05.01.2024",
    nights: 4,
    room_pax: "2 Oda / 4 Pax",
    events_html: "Yok",
    notes: "Test"
  },
  hotelData: {
    name: "Test Hotel"
  }
};

fetch('http://localhost:3000/api/send-request-mail', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
