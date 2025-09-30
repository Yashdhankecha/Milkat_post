// Simple server test script
import fetch from 'node-fetch';

const testServer = async () => {
  try {
    console.log('Testing server connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/health');
    console.log('Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health check response:', healthData);
    }
    
    // Test society endpoint (should return 401 without auth)
    const societyResponse = await fetch('http://localhost:5000/api/societies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Society',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        total_flats: 100
      })
    });
    
    console.log('Society endpoint status:', societyResponse.status);
    
    if (!societyResponse.ok) {
      const errorData = await societyResponse.json();
      console.log('Society endpoint error (expected):', errorData);
    }
    
    console.log('✅ Server is responding correctly');
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    console.log('Make sure the server is running with: npm start');
  }
};

testServer();
