# Nestly Estate Migration Guide

This guide will help you migrate your Supabase-based Nestly Estate project to a MongoDB, React, Node.js, Express, JWT, and file management system with proper client-server architecture.

## 🏗️ Architecture Overview

### Backend (Node.js + Express + MongoDB)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary (production) / Local storage (development)
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom wrapper
- **UI Components**: Radix UI + Tailwind CSS
- **Routing**: React Router v6

## 📁 Project Structure

```
nestly_estate_mine/
├── backend/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── scripts/            # Migration scripts
│   └── server.js           # Main server file
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # API client and utilities
│   └── ...
└── MIGRATION_GUIDE.md      # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Cloudinary account (for file storage)
- Twilio account (for SMS)

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
```bash
cp env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/nestly_estate

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRE=30d

# File Upload Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Start Backend Server
```bash
# Development
npm run dev

# Production
npm start
```

### 2. Frontend Setup

#### Install Dependencies
```bash
# From project root
npm install
```

#### Environment Configuration
Create `.env.local` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_MOCK_OTP=true  # Set to false in production
```

#### Start Frontend Development Server
```bash
npm run dev
```

### 3. Database Migration

#### Run Migration Script
```bash
cd backend
npm run migrate
```

This will:
- Connect to your Supabase database
- Extract all data from existing tables
- Transform and migrate data to MongoDB
- Create proper relationships and indexes

#### Migration Process
The migration script will migrate:
- ✅ Users and Profiles
- ✅ Properties
- ✅ Projects
- ✅ Societies
- ✅ Brokers
- ✅ Developers
- ✅ All related data and relationships

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Projects
- `GET /api/projects` - Get all projects (with filters)
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `POST /api/upload/document` - Upload document
- `POST /api/upload/profile-picture` - Upload profile picture

## 🔐 Authentication Flow

### Phone-based Authentication
1. User enters phone number
2. System sends OTP via SMS
3. User enters OTP
4. System verifies OTP and returns JWT token
5. Token is stored and used for subsequent requests

### Multi-role Support
- Users can have multiple roles (buyer_seller, broker, developer, etc.)
- Role switching is supported within the same account
- Each role has different permissions and access levels

## 📱 Frontend Integration

### API Client
The frontend uses a custom API client (`src/lib/api.js`) that:
- Handles authentication tokens automatically
- Provides type-safe API methods
- Manages file uploads
- Handles errors consistently

### Authentication Hook
The `useAuth` hook provides:
- User state management
- Authentication methods
- Role switching
- Token management

### Example Usage
```typescript
import { useAuth } from '@/hooks/useAuth'
import { propertyAPI } from '@/lib/api'

function MyComponent() {
  const { user, profile, loading } = useAuth()
  
  const fetchProperties = async () => {
    try {
      const response = await propertyAPI.getProperties({
        city: 'Mumbai',
        propertyType: 'apartment'
      })
      console.log(response.data.properties)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    }
  }
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>Welcome, {profile?.fullName}</h1>
      <button onClick={fetchProperties}>Load Properties</button>
    </div>
  )
}
```

## 🛡️ Security Features

### Backend Security
- JWT authentication with refresh tokens
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet for security headers
- Password hashing with bcrypt

### Frontend Security
- Token-based authentication
- Automatic token refresh
- Secure token storage
- API request validation

## 📊 Database Schema

### Key Collections
- **users** - User accounts and authentication
- **profiles** - User profiles with role information
- **properties** - Property listings
- **projects** - Development projects
- **societies** - Housing societies
- **brokers** - Broker profiles
- **developers** - Developer profiles

### Relationships
- Users have multiple profiles (multi-role)
- Properties belong to users (owners/brokers)
- Projects belong to developers
- Societies belong to society owners

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)
4. Set up Cloudinary for file storage
5. Configure Twilio for SMS

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Update API URL in environment variables

## 🔄 Migration Checklist

- [ ] Set up MongoDB database
- [ ] Configure backend environment variables
- [ ] Run migration script
- [ ] Test API endpoints
- [ ] Update frontend environment variables
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Verify all features work correctly
- [ ] Deploy to production

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `ALLOWED_ORIGINS` in backend `.env`
   - Ensure frontend URL is included

2. **Authentication Issues**
   - Verify JWT secrets are set correctly
   - Check token expiration settings

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file types

4. **Database Connection Issues**
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure database permissions

### Support
For issues or questions, please check the logs and error messages first. The system includes comprehensive logging for debugging.

## 📝 Notes

- The migration preserves all existing data and relationships
- The new system is more scalable and maintainable
- File storage is now handled by Cloudinary for better performance
- Authentication is more secure with JWT and refresh tokens
- The API is RESTful and well-documented
- The frontend is more modular and type-safe

This migration provides a solid foundation for scaling your real estate platform with modern technologies and best practices.
