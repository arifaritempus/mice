async function test() {
  const url = "http://localhost:5001/api/operations/transfers?page=1&pageSize=20&searchTerm=&filter=all&sortField=&sortDirection=asc&startDate=2026-07-31&endDate=&stayStart=&stayEnd=&referenceTerms=%5B%5D&companyTerms=%5B%5D&customerTerms=%5B%5D&supplierTerms=%5B%5D&hotelTerms=%5B%5D&guestTerms=%5B%5D&flightTerms=%5B%5D";
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch(e) {
    console.error("Fetch error:", e);
  }
}
test();
