const https = require('https');

const data = JSON.stringify({
  fields: {
    adminId: { stringValue: '1020304' },
    adminPw: { stringValue: 'admin1234' },
    updatedAt: { integerValue: Date.now().toString() }
  }
});

const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: '/v1/projects/ai-studio-rjtrust-b0b9a339-e35d-49b9-9fde-d4df4e7d52b4/databases/(default)/documents/settings/adminCredentials',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
