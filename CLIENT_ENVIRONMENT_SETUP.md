    # Client Environment Setup Guide

    This guide explains how to configure environment variables for the Milkat Post frontend application.

    ## Environment Files

    ### 1. Development Environment (`.env`)

    Create a `.env` file in the `client` directory for local development:

    ```bash
    # Copy the example file
    cp client/env.example client/.env
    ```

    **Development Configuration:**
    ```env
    # API Configuration
    VITE_API_URL=http://localhost:5000/api

    # Application Configuration
    VITE_APP_NAME=Milkat Post
    VITE_APP_VERSION=1.0.0
    VITE_APP_DESCRIPTION=Real Estate Management Platform

    # Environment
    VITE_NODE_ENV=development

    # Features
    VITE_ENABLE_ANALYTICS=false
    VITE_ENABLE_DEBUG=true

    # External Services (Optional for development)
    VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
    VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key

    # File Upload
    VITE_MAX_FILE_SIZE=10485760
    VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

    # WebSocket
    VITE_WS_URL=ws://localhost:5000

    # Support
    VITE_SUPPORT_EMAIL=support@milkatpost.com
    VITE_CONTACT_PHONE=+91-9876543210
    ```

    ### 2. Production Environment (`.env.production`)

    For production builds, create a `.env.production` file:

    ```bash
    # Copy the production template
    cp client/env.production client/.env.production
    ```

    **Production Configuration:**
    ```env
    # API Configuration
    VITE_API_URL=https://yourdomain.com/api

    # Application Configuration
    VITE_APP_NAME=Milkat Post
    VITE_APP_VERSION=1.0.0
    VITE_APP_DESCRIPTION=Real Estate Management Platform

    # Environment
    VITE_NODE_ENV=production

    # Features
    VITE_ENABLE_ANALYTICS=true
    VITE_ENABLE_DEBUG=false

    # External Services
    VITE_GOOGLE_MAPS_API_KEY=your-production-google-maps-api-key
    VITE_RECAPTCHA_SITE_KEY=your-production-recaptcha-site-key

    # File Upload
    VITE_MAX_FILE_SIZE=10485760
    VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

    # WebSocket
    VITE_WS_URL=wss://yourdomain.com

    # Analytics
    VITE_GA_TRACKING_ID=your-production-google-analytics-id

    # Support
    VITE_SUPPORT_EMAIL=support@milkatpost.com
    VITE_CONTACT_PHONE=+91-9876543210

    # Security
    VITE_CSP_NONCE=true

    # Performance
    VITE_ENABLE_SERVICE_WORKER=true
    VITE_ENABLE_PRECACHING=true
    ```

    ## Environment Variables Explained

    ### Core Configuration

    | Variable | Description | Development | Production |
    |----------|-------------|-------------|------------|
    | `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` | `https://yourdomain.com/api` |
    | `VITE_APP_NAME` | Application name | `Milkat Post` | `Milkat Post` |
    | `VITE_NODE_ENV` | Environment mode | `development` | `production` |

    ### Feature Flags

    | Variable | Description | Development | Production |
    |----------|-------------|-------------|------------|
    | `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false` | `true` |
    | `VITE_ENABLE_DEBUG` | Enable debug logging | `true` | `false` |
    | `VITE_ENABLE_SERVICE_WORKER` | Enable PWA features | `false` | `true` |

    ### External Services

    | Variable | Description | Required | Notes |
    |----------|-------------|----------|-------|
    | `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Optional | For map features |
    | `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA site key | Optional | For form protection |
    | `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Optional | For direct uploads |

    ### WebSocket Configuration

    | Variable | Description | Development | Production |
    |----------|-------------|-------------|------------|
    | `VITE_WS_URL` | WebSocket server URL | `ws://localhost:5000` | `wss://yourdomain.com` |

    ## How to Use Environment Variables

    ### In React Components

    ```typescript
    // Access environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    const appName = import.meta.env.VITE_APP_NAME;
    const isDebug = import.meta.env.VITE_ENABLE_DEBUG === 'true';

    // Use in component
    function MyComponent() {
    console.log('API URL:', apiUrl);
    console.log('App Name:', appName);
    
    if (isDebug) {
        console.log('Debug mode enabled');
    }
    
    return <div>{appName}</div>;
    }
    ```

    ### In API Client

    The API client automatically uses the `VITE_API_URL` environment variable:

    ```typescript
    // client/src/lib/api.ts
    const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
    ```

    ### In Vite Configuration

    ```typescript
    // vite.config.js
    import { defineConfig } from "vite";

    export default defineConfig(({ mode }) => ({
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    server: {
        host: "::",
        port: 3000,
    },
    }));
    ```

    ## Build Commands

    ### Development Build

    ```bash
    # Start development server
    npm run dev

    # Build for development
    npm run build
    ```

    ### Production Build

    ```bash
    # Build for production (uses .env.production)
    npm run build --mode production

    # Preview production build
    npm run preview
    ```

    ## Environment Variable Validation

    Create a validation script to ensure required variables are set:

    ```typescript
    // client/src/utils/envValidation.ts
    function validateEnvironment() {
    const required = [
        'VITE_API_URL',
        'VITE_APP_NAME',
    ];
    
    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    }

    export { validateEnvironment };
    ```

    ## Security Considerations

    ### 1. Never Expose Sensitive Data

    - Only use `VITE_` prefixed variables for client-side code
    - Never include API keys, secrets, or passwords in client environment variables
    - All `VITE_` variables are publicly accessible in the built application

    ### 2. Environment-Specific Configuration

    ```env
    # Development - relaxed security
    VITE_ENABLE_DEBUG=true
    VITE_ENABLE_ANALYTICS=false

    # Production - strict security
    VITE_ENABLE_DEBUG=false
    VITE_ENABLE_ANALYTICS=true
    VITE_CSP_NONCE=true
    ```

    ### 3. Content Security Policy

    For production, configure CSP headers in your web server:

    ```nginx
    # Nginx configuration
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google-analytics.com; style-src 'self' 'unsafe-inline';" always;
    ```

    ## Deployment Configuration

    ### 1. Hostinger Deployment

    Update your production environment file:

    ```env
    # Production configuration for Hostinger
    VITE_API_URL=https://yourdomain.com/api
    VITE_WS_URL=wss://yourdomain.com
    VITE_GOOGLE_MAPS_API_KEY=your-production-key
    VITE_GA_TRACKING_ID=your-analytics-id
    ```

    ### 2. Build Process

    ```bash
    # Install dependencies
    npm ci

    # Build for production
    npm run build --mode production

    # The built files will be in the 'dist' directory
    ```

    ### 3. Nginx Configuration

    ```nginx
    # Serve the built React app
    location / {
        root /var/www/milkatpost/client/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    ```

    ## Troubleshooting

    ### Common Issues

    #### 1. Environment Variables Not Loading

    ```bash
    # Check if .env file exists
    ls -la client/.env

    # Check file permissions
    chmod 644 client/.env

    # Restart development server
    npm run dev
    ```

    #### 2. API Connection Issues

    ```bash
    # Check API URL configuration
    echo $VITE_API_URL

    # Test API connectivity
    curl http://localhost:5000/health
    ```

    #### 3. Build Issues

    ```bash
    # Clear Vite cache
    rm -rf client/node_modules/.vite

    # Reinstall dependencies
    npm ci

    # Rebuild
    npm run build
    ```

    ### Debug Environment Variables

    ```typescript
    // Debug script to check environment variables
    console.log('Environment Variables:');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('VITE_APP_NAME:', import.meta.env.VITE_APP_NAME);
    console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
    console.log('All VITE_ vars:', import.meta.env);
    ```

    ## Best Practices

    ### 1. Environment File Management

    - Keep `.env` files out of version control
    - Use `.env.example` as a template
    - Document all environment variables
    - Use descriptive variable names

    ### 2. Default Values

    ```typescript
    // Provide fallback values
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const debugMode = import.meta.env.VITE_ENABLE_DEBUG === 'true';
    ```

    ### 3. Type Safety

    ```typescript
    // Define environment variable types
    interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_ENABLE_DEBUG: string;
    }

    interface ImportMeta {
    readonly env: ImportMetaEnv;
    }
    ```

    ### 4. Validation

    ```typescript
    // Validate environment variables at startup
    function validateEnv() {
    const required = ['VITE_API_URL', 'VITE_APP_NAME'];
    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
        console.error('Missing environment variables:', missing);
        return false;
    }
    
    return true;
    }

    // Call validation
    if (!validateEnv()) {
    throw new Error('Environment validation failed');
    }
    ```

    ## Summary

    Your client environment is now properly configured with:

    - ✅ Development environment (`.env`)
    - ✅ Production environment (`.env.production`)
    - ✅ Environment variable documentation
    - ✅ Security best practices
    - ✅ Build and deployment configuration
    - ✅ Troubleshooting guide

    The frontend will now properly connect to your backend API and use the appropriate configuration for each environment.
