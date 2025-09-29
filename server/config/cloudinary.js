import { v2 as cloudinary } from 'cloudinary';
import config from '../config-loader.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true
});

// Test Cloudinary connection only if properly configured
const cloudinaryConfig = (await import('../config-loader.js')).default;
const isCloudinaryConfigured = cloudinaryConfig.CLOUDINARY_CLOUD_NAME && 
                               cloudinaryConfig.CLOUDINARY_CLOUD_NAME !== 'your-cloudinary-cloud-name' &&
                               cloudinaryConfig.CLOUDINARY_API_KEY && 
                               cloudinaryConfig.CLOUDINARY_API_KEY !== 'your-cloudinary-api-key';

if (isCloudinaryConfigured) {
  cloudinary.api.ping()
    .then(result => {
      console.log('✅ Cloudinary connection successful:', result);
    })
    .catch(error => {
      console.error('❌ Cloudinary connection failed:', error);
    });
} else {
  console.log('⚠️  Cloudinary not configured - using local file storage for development');
}

export default cloudinary;
