// Helper scripts for Supabase operations
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Function to check if Supabase CLI is available
function checkSupabaseCLI() {
  try {
    execSync('npx supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to link Supabase project
function linkSupabaseProject() {
  if (!checkSupabaseCLI()) {
    console.log('❌ Supabase CLI not found. Please install it first:');
    console.log('npm install -g supabase');
    return;
  }

  try {
    console.log('🔗 Linking Supabase project...');
    execSync('npx supabase link --project-ref xwpwkatpplinbtgoiayl', { stdio: 'inherit' });
    console.log('✅ Supabase project linked successfully!');
  } catch (error) {
    console.error('❌ Failed to link Supabase project:', error.message);
  }
}

// Function to reset the database
function resetDatabase() {
  if (!checkSupabaseCLI()) {
    console.log('❌ Supabase CLI not found. Please install it first:');
    console.log('npm install -g supabase');
    return;
  }

  console.log('⚠️  This will reset your database. Are you sure? (y/N)');
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      const response = chunk.trim().toLowerCase();
      if (response === 'y' || response === 'yes') {
        try {
          console.log('🗑️  Resetting database...');
          execSync('npx supabase db reset', { stdio: 'inherit' });
          console.log('✅ Database reset successfully!');
        } catch (error) {
          console.error('❌ Failed to reset database:', error.message);
        }
      } else {
        console.log('❌ Database reset cancelled.');
      }
      process.stdin.destroy();
    }
  });
}

// Function to create a new migration
function createMigration(name) {
  if (!checkSupabaseCLI()) {
    console.log('❌ Supabase CLI not found. Please install it first:');
    console.log('npm install -g supabase');
    return;
  }

  if (!name) {
    console.log('❌ Please provide a migration name:');
    console.log('node scripts/supabase-helpers.js create-migration <name>');
    return;
  }

  try {
    console.log(`📝 Creating migration: ${name}`);
    execSync(`npx supabase migration new ${name}`, { stdio: 'inherit' });
    console.log('✅ Migration created successfully!');
  } catch (error) {
    console.error('❌ Failed to create migration:', error.message);
  }
}

// Main function to handle commands
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'link':
      linkSupabaseProject();
      break;
    case 'reset':
      resetDatabase();
      break;
    case 'create-migration':
      createMigration(args[1]);
      break;
    case 'help':
      console.log(`
Supabase Helper Scripts

Usage: node scripts/supabase-helpers.js <command>

Commands:
  link              Link the Supabase project
  reset             Reset the database (⚠️  Destructive!)
  create-migration <name>  Create a new migration file
  help              Show this help message

Examples:
  node scripts/supabase-helpers.js link
  node scripts/supabase-helpers.js create-migration add_new_table
      `);
      break;
    default:
      console.log('❌ Unknown command. Use "help" to see available commands.');
  }
}

// Run the main function
main();