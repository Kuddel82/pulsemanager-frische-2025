const https = require('https');

console.log('🧪 Testing PULSECHAIN API...');

const testAddress = '0x0000000000000000000000000000000000000000';
const url = `https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/pulsechain?address=${testAddress}`;

console.log('URL:', url);

https.get(url, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200) {
        console.log('✅ PULSECHAIN API: WORKING!');
      } else {
        console.log('❌ PULSECHAIN API: ERROR!');
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('❌ Request failed:', e.message);
}); 