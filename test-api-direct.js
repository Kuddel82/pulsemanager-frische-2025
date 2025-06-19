// Direkter API-Test
const testAPI = async () => {
  try {
    console.log('🧪 Teste API direkt...');
    
    const response = await fetch('https://pulsemanager.vip/api/german-tax-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '0x3f020b',
        chain: 'all'
      })
    });

    const data = await response.json();
    console.log('✅ API Response:', data);
    
    if (data.taxReport) {
      console.log('📊 Transaktionen:', data.taxReport.transactions?.length || 0);
      console.log('📈 Summary:', data.taxReport.summary);
      console.log('🔍 Metadata:', data.taxReport.metadata);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
};

testAPI(); 