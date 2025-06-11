// Test simple API
const https = require('https');

const url = 'https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/test-simple?address=0x0000000000000000000000000000000000000000';

console.log('🧪 Testing SIMPLE API...');
console.log('URL:', url);

https.get(url, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        if (json._test_mode) {
          console.log('✅ SIMPLE API: WORKING!');
        } else {
          console.log('❌ SIMPLE API: Unexpected response');
        }
      } catch (e) {
        console.log('❌ Invalid JSON response');
      }
    } else {
      console.log('❌ HTTP ERROR:', res.statusCode);
    }
  });
}).on('error', (err) => {
  console.log('💥 CONNECTION ERROR:', err.message);
}); 