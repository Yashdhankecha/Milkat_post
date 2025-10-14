# Welcome to MilkatPost

## Project info

**URL**: https://lovable.dev/projects/c41a95a4-0234-486c-8047-99be29f445f8

## Local Development Setup

This project is configured to work with both Supabase and Lovable for local development.

### Environment Configuration

The project is already configured with the necessary environment variables in the `.env` file:

```env
VITE_SUPABASE_PROJECT_ID="xwpwkatpplinbtgoiayl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cHdrYXRwcGxpbmJ0Z29pYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM2NzUsImV4cCI6MjA3MjM4OTY3NX0.BlkGefwxmwhokAuK37zJm7nKC2beZF3x6gJB_rf8FXQ"
VITE_SUPABASE_URL="https://xwpwkatpplinbtgoiayl.supabase.co"
VITE_MOCK_OTP=true
```

### Starting the Development Server

To start the local development server:

```bash
npm run dev
```

The application will be available at http://localhost:8082 (or the next available port if 8080/8081 are in use).

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c41a95a4-0234-486c-8047-99be29f445f8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

- React 18
- Vite
- TypeScript
- Supabase (Authentication & Database)
- Tailwind CSS
- shadcn-ui

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c41a95a4-0234-486c-8047-99be29f445f8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

HELLO THIS IS MY FIRST PUSH...