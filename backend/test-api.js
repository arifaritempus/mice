const jwt = require('jsonwebtoken');
const secret = "r1NqffzcJIuqeNd8n2nhRK3m7DmS/ts8xqQERutYZYb7W/cU0BAeNFdd0RgUugmDfPPmlKVwv+Ne4Nq60bAQmg==";
const token = jwt.sign({ userId: 'test_user_id', company_id: 'test_company' }, secret, { expiresIn: '1h' });

fetch("http://localhost:6001/api/reports/data?reportId=opsiyon_takip&page=1&pageSize=20", {
  headers: { "Authorization": `Bearer ${token}` }
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
