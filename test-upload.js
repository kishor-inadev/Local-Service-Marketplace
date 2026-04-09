const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    fs.writeFileSync('test.txt', 'hello world');
    
    const form = new FormData();
    form.append('file', fs.createReadStream('test.txt'));
    form.append('document_type', 'government_id');
    form.append('expiry_date', '2029-06-29');

    const response = await axios.post(
      'http://localhost:3700/api/v1/provider-documents/upload/4b79f197-9988-4752-b3b8-3a44d055ea8a',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjM2U3YjdjYy03MmNhLTQ2MzgtOGI0OS1lMTRjNmM5MDg3MWQiLCJlbWFpbCI6Imtpc2hvcjgxMTYwQGdtYWlsLmNvbSIsInJvbGUiOiJwcm92aWRlciIsImlhdCI6MTc3NTc1ODc5MiwiZXhwIjoxNzc1NzU5NjkyfQ.3sw5R3Dr6L2KJrVub59FavPDfab3Oa8-Omd7rvqBlFU'
        }
      }
    );
    console.log('Success:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpload();
