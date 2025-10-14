# Local Development Configuration for Supabase and Lovable

## Project Information

- **Lovable Project URL**: https://lovable.dev/projects/c41a95a4-0234-486c-8047-99be29f445f8
- **Supabase Project ID**: xwpwkatpplinbtgoiayl
- **Supabase URL**: https://xwpwkatpplinbtgoiayl.supabase.co

## Environment Variables

The following environment variables are already configured in the `.env` file:

```env
VITE_SUPABASE_PROJECT_ID="xwpwkatpplinbtgoiayl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cHdrYXRwcGxpbmJ0Z29pYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM2NzUsImV4cCI6MjA3MjM4OTY3NX0.BlkGefwxmwhokAuK37zJm7nKC2beZF3x6gJB_rf8FXQ"
VITE_SUPABASE_URL="https://xwpwkatpplinbtgoiayl.supabase.co"
VITE_MOCK_OTP=true
```

## Connection Verification

To verify that your local development environment is properly connected:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Check the console logs** for any Supabase connection errors

3. **Test Supabase functionality** by:
   - Opening `http://localhost:8082/test-supabase.html` in your browser for CDN-based testing
   - Opening `http://localhost:8082/app-test.html` in your browser for application-based testing
   - Clicking the "Test Supabase Connection" button
   - Verifying that the connection is successful

4. **Manual browser console test**:
   ```javascript
   // In the browser console after the app loads
   // Note: This requires the Vite development server to compile TypeScript
   import('/src/integrations/supabase/client.ts').then(module => {
     module.supabase.from('profiles').select('id').limit(1).then(console.log);
   });
   ```

## Troubleshooting

### If you encounter connection issues:

1. **Verify environment variables**:
   - Ensure all variables in `.env` are correct
   - Make sure there are no extra spaces or quotes

2. **Check Supabase client configuration**:
   - File: `src/integrations/supabase/client.ts`
   - Verify the URL and key match the environment variables
   - Ensure the client handles both browser and Node.js environments

3. **Network connectivity**:
   - Ensure you can access `https://xwpwkatpplinbtgoiayl.supabase.co` in your browser
   - Check if any firewall or proxy is blocking the connection

4. **MIME Type Errors**:
   - These occur when trying to import TypeScript files directly in the browser
   - Use the provided test pages instead, or ensure you're using the Vite development server

### If you need to reset the database:

1. **Reset local database** (if using local Supabase):
   ```bash
   npx supabase db reset
   ```

2. **Apply migrations**:
   ```bash
   npx supabase migration up
   ```

## Lovable Integration

The project is already configured with the Lovable tagger plugin in `vite.config.ts`:

```javascript
import { componentTagger } from "lovable-tagger";

// ...

plugins: [
  react(),
  mode === 'development' &&
  componentTagger(),
].filter(Boolean),
```

This enables component tagging during development for better integration with Lovable.

## Development Workflow

1. **Local Development**:
   - Run `npm run dev` to start the local development server
   - Changes will be reflected in real-time
   - Component tags will be visible in the Lovable editor

2. **Pushing Changes**:
   - Commit and push changes to GitHub
   - Changes will automatically sync with Lovable

3. **Pulling Changes**:
   - Pull the latest changes from the repository
   - Run `npm install` if new dependencies were added

## Additional Resources

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Project README](../../README.md)