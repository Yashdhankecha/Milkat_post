import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://ansphd17_db_user:ansharshyash@milkatpost.lzhmmp7.mongodb.net/?retryWrites=true&w=majority&appName=Milkatpost';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

testConnection();
