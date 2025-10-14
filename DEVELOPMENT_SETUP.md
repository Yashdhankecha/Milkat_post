# Development Setup Guide

This guide explains how to set up your local development environment for the MilkatPost project, which integrates with both Supabase and Lovable.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Git

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd milkatpost
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development setup script**:
   ```bash
   npm run dev:setup
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Environment Configuration

The project uses environment variables for configuration. These are stored in the `.env` file:

```env
VITE_SUPABASE_PROJECT_ID="xwpwkatpplinbtgoiayl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cHdrYXRwcGxpbmJ0Z29pYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM2NzUsImV4cCI6MjA3MjM4OTY3NX0.BlkGefwxmwhokAuK37zJm7nKC2beZF3x6gJB_rf8FXQ"
VITE_SUPABASE_URL="https://xwpwkatpplinbtgoiayl.supabase.co"
VITE_MOCK_OTP=true
```

## Development Scripts

- `npm run dev` - Start the development server
- `npm run dev:setup` - Run the development environment setup script
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build

## Supabase Integration

The project is already configured to work with the Supabase project:

- **Project ID**: xwpwkatpplinbtgoiayl
- **URL**: https://xwpwkatpplinbtgoiayl.supabase.co
- **Publishable Key**: Included in the environment variables

### Testing Supabase Connection

Since the Supabase client uses browser-specific APIs like `localStorage`, connection testing must be done in the browser:

1. **Browser-based test page**: Open `http://localhost:8082/test-supabase.html` after starting the development server
2. **Manual browser console test**: 
   ```javascript
   // In the browser console after the app loads
   import('/src/integrations/supabase/client.ts').then(({ supabase }) => {
     supabase.from('profiles').select('id').limit(1).then(console.log);
   });
   ```

## Lovable Integration

The project includes the Lovable tagger for development:

- Enabled in `vite.config.ts`
- Only active in development mode
- Helps with component identification in the Lovable editor

## Project Structure

```
milkatpost/
├── src/                 # Source code
├── public/              # Static assets
├── supabase/            # Supabase configurations and migrations
├── scripts/             # Development scripts
├── .env                 # Environment variables
├── vite.config.ts       # Vite configuration
└── package.json         # Project dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **Port in use**: If port 8080 or 8081 is in use, Vite will automatically use the next available port.

2. **Environment variables not loading**: 
   - Ensure the `.env` file is in the root directory
   - Restart the development server after making changes

3. **Supabase connection errors**:
   - Verify the URL and key in `.env`
   - Check your internet connection
   - Ensure the Supabase project is active

### Verifying Setup

Run the development setup script to verify your environment:
```bash
npm run dev:setup
```

This script will check:
- Node.js version
- Environment variables
- Dependencies
- Supabase CLI availability

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Lovable Documentation](https://docs.lovable.dev/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Local Development Configuration](supabase/configs/local_dev_config.md)