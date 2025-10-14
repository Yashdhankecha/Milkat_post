// Test script to verify Supabase connection
// Note: This script is meant to be run in the browser environment through the Vite development server
// For direct browser testing, use the HTML test pages instead

console.log('ℹ️  To test Supabase connection:');
console.log('ℹ️  1. Start the development server with "npm run dev"');
console.log('ℹ️  2. Open http://localhost:8082/test-supabase.html or http://localhost:8082/app-test.html in your browser');
console.log('ℹ️  3. Click the "Test Supabase Connection" button');

// If running in Node.js environment, exit gracefully
if (typeof window === 'undefined') {
  console.log('ℹ️  This test script is designed to run in a browser environment.');
  console.log('ℹ️  For Node.js testing, use the development setup script: npm run dev:setup');
}

// Dynamic import to avoid issues in Node.js environment
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Dynamically import the supabase client
    const { supabase } = await import('./src/integrations/supabase/client');
    
    // Test a simple query to verify connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Supabase connection test failed:');
      console.log('Error:', error.message);
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log('Sample data:', data);
    
    // Test auth status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session status:', session ? 'Authenticated' : 'Not authenticated');
    
  } catch (error) {
    console.log('❌ Supabase connection test failed with exception:');
    console.log(error);
  }
}

// Run the test only in browser environment
if (typeof window !== 'undefined') {
  testSupabaseConnection();
}