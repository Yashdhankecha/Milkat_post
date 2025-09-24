# 🏠 Nestly Estate Platform

A modern, full-stack real estate platform built with React, Node.js, Express, and MongoDB.

## 📁 Project Structure

```
nestly-estate-platform/
├── client/                 # React Frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── ...                # Frontend config files
├── server/                # Node.js Backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   ├── scripts/           # Migration scripts
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main server file
├── package.json           # Root package.json
├── setup-migration.js     # Setup script
└── MIGRATION_GUIDE.md     # Migration documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Cloudinary account (for file storage)
- Twilio account (for SMS)

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd nestly-estate-platform
   npm run setup
   ```

2. **Configure environment:**
   - Edit `server/.env` with your MongoDB, Cloudinary, and Twilio credentials
   - Edit `client/.env.local` with your API URL

3. **Run migration:**
   ```bash
   npm run server:migrate
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## 📋 Available Scripts

### Root Level
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the client for production
- `npm run start` - Start the server in production mode
- `npm run setup` - Install all dependencies and setup the project
- `npm run install:all` - Install dependencies for all packages

### Client Scripts
- `npm run client:dev` - Start React development server
- `npm run client:build` - Build React app for production
- `npm run client:preview` - Preview production build
- `npm run client:lint` - Run ESLint on client code

### Server Scripts
- `npm run server:dev` - Start Node.js server in development mode
- `npm run server:start` - Start Node.js server in production mode
- `npm run server:migrate` - Run database migration

## 🏗️ Architecture

### Frontend (Client)
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Custom API client with fetch
- **Routing**: React Router v6

### Backend (Server)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary (production) / Local (development)
- **Security**: Helmet, CORS, rate limiting, input validation

## 🔐 Authentication

- Phone-based authentication with OTP
- JWT tokens with refresh mechanism
- Multi-role support (admin, buyer_seller, broker, developer, society_owner, society_member)
- Role-based access control

## 📊 Features

- **Property Management**: List, search, and manage properties
- **Project Management**: Developer project listings
- **Society Management**: Housing society management
- **User Profiles**: Multi-role user profiles
- **File Uploads**: Image and document management
- **Search & Filtering**: Advanced property search
- **Dashboard**: Role-specific dashboards

## 🛠️ Development

### Environment Variables

#### Server (`server/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nestly_estate
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
TWILIO_ACCOUNT_SID=your-twilio-sid
```

#### Client (`client/.env.local`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_MOCK_OTP=true
```

### API Endpoints

- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/properties` - Get properties
- `POST /api/properties` - Create property
- `GET /api/projects` - Get projects
- `POST /api/upload/image` - Upload image

## 🚀 Deployment

### Backend
1. Set up MongoDB Atlas
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend
1. Build: `npm run client:build`
2. Deploy to Vercel, Netlify, or your preferred platform

## 📝 Migration

This project was migrated from Supabase to MongoDB. See `MIGRATION_GUIDE.md` for detailed migration instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
1. Check the logs and error messages
2. Review the migration guide
3. Check environment configuration
4. Create an issue in the repository

---

**Built with ❤️ for the real estate industry**