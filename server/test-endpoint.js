// Test script to verify the OTP endpoint
const testOTPEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '9876543210',
        role: 'buyer_seller'
      })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ OTP endpoint working correctly!');
    } else {
      console.log('❌ OTP endpoint returned error:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
};

testOTPEndpoint();
