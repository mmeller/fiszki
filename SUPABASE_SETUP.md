# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Fiszki flashcard application.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Basic knowledge of SQL databases

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a free account
3. Click "New Project"
4. Fill in the project details:

   - **Project Name**: fiszki-flashcards (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to you
   - **Pricing Plan**: Free tier is sufficient for personal use

5. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, click on the **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `schema.sql` from this project
4. Paste it into the SQL editor
5. Click **Run** or press `Ctrl/Cmd + Enter`
6. You should see a success message: "Success. No rows returned"

This will create:

- `categories` table for organizing flashcards
- `words` table for storing flashcard words
- Row Level Security (RLS) policies to protect user data
- Helper functions and triggers

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, click on **Settings** (gear icon) in the left sidebar
2. Click on **API** under Project Settings
3. You'll see two important values:

   - **Project URL**: Looks like `https://xyzcompany.supabase.co`
   - **Project API keys > anon public**: A long string starting with `eyJ...`

4. Copy these values (you'll need them in the next step)

## Step 4: Configure the Application

1. Open `config.js` in your project folder
2. Replace the placeholder values with your actual Supabase credentials:

```javascript
const SUPABASE_CONFIG = {
  url: "https://xyzcompany.supabase.co", // Your Project URL
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Your anon public key
};
```

3. Save the file

## Step 5: Verify the Setup

1. Open `auth.html` in your web browser
2. Try creating a new account:

   - Enter your email and a password (minimum 6 characters)
   - Click "Sign Up"
   - Check your email for a confirmation link from Supabase
   - Click the confirmation link

3. After confirming your email, return to `auth.html` and sign in

4. You should be redirected to the main application (`index.html`)

## Step 6: Test the Sync Functionality

1. Create a new category in the app
2. Import some words to that category
3. Open the browser's Developer Console (F12)
4. Look for sync messages like:

   - "Syncing to cloud: addCategory"
   - "Cloud sync successful"

5. To test multi-device sync:
   - Sign in on another device or browser
   - Your categories and words should appear automatically
   - Make changes on one device and verify they sync to the other

## Sync Modes

The application supports three sync modes (configured in `config.js`):

### 1. Auto Mode (Recommended)

```javascript
mode: "auto";
```

- Automatically syncs all changes to the cloud immediately
- Best for online usage with real-time sync across devices

### 2. Manual Mode

```javascript
mode: "manual";
```

- Changes are saved locally first
- You manually trigger sync when ready
- Good for unstable internet connections

### 3. Offline-Only Mode

```javascript
mode: "offline-only";
```

- No cloud sync, all data stays on your device
- Use this if you don't want to create a Supabase account
- Good for privacy-focused users

## Troubleshooting

### "Configuration missing" Error

**Problem**: The app shows "Configuration missing. Please set up config.js"

**Solution**:

- Make sure you've edited `config.js` with your actual Supabase credentials
- Ensure you're using the correct URL (starts with `https://`)
- Check that the anon key is copied correctly (it's very long!)

### "Invalid API key" Error

**Problem**: Sign in fails with an API key error

**Solution**:

- Double-check you copied the **anon public** key (not the service_role key)
- Make sure there are no extra spaces before or after the key
- Verify the Project URL matches your project

### Email Confirmation Not Received

**Problem**: After signing up, no confirmation email arrives

**Solution**:

- Check your spam/junk folder
- In Supabase Dashboard → Authentication → Settings:
  - Make sure "Enable email confirmations" is checked
  - Check "Email Auth" is enabled
- Try signing up with a different email provider

### Data Not Syncing

**Problem**: Changes on one device don't appear on another

**Solution**:

- Check that both devices are signed in with the same account
- Verify internet connection on both devices
- Open browser console (F12) and look for sync errors
- Try manually refreshing the page
- Check sync mode in `config.js` is set to 'auto'

### RLS Policy Errors

**Problem**: "Row Level Security policy violation" errors

**Solution**:

- Make sure you ran the entire `schema.sql` file
- Verify you're signed in (RLS policies require authentication)
- Check that the user_id column is being set correctly

## Security Best Practices

1. **Never commit `config.js` to public repositories**

   - Add `config.js` to `.gitignore`
   - The anon key is public-safe but should still be protected

2. **Use Row Level Security (RLS)**

   - Already configured in `schema.sql`
   - Each user can only access their own data

3. **Email Confirmation**

   - Keep email confirmation enabled in Supabase
   - Prevents spam accounts

4. **Regular Backups**
   - Supabase provides automatic backups
   - You can also export data from the SQL Editor

## Database Maintenance

### View Your Data

1. In Supabase Dashboard → **Table Editor**
2. Select `categories` or `words` table
3. You can view, edit, and delete records manually

### Export Data

1. In Supabase Dashboard → **SQL Editor**
2. Run:

```sql
SELECT * FROM categories WHERE user_id = auth.uid();
SELECT * FROM words WHERE user_id = auth.uid();
```

3. Click **Download as CSV**

### Delete All Data

If you want to start fresh:

```sql
DELETE FROM words WHERE user_id = auth.uid();
DELETE FROM categories WHERE user_id = auth.uid();
```

## Cost Estimates

Supabase **Free Tier** includes:

- 500MB database space
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

For a personal flashcard app, the free tier should be more than sufficient. Each word takes approximately:

- Categories: ~100 bytes each
- Words: ~200 bytes each

So you could store:

- ~5,000 categories
- ~2,500,000 words

## Migration from Local to Cloud

If you've been using the app in offline mode and want to migrate to cloud:

1. Sign up for a Supabase account and configure `config.js`
2. Sign in to the app
3. Open the browser console (F12)
4. Run this command:

```javascript
// In the console, after sync manager is initialized
await syncManager.migrateLocalToCloud();
```

This will:

- Upload all your local categories to the cloud
- Upload all your local words to the cloud
- Preserve all data and relationships

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create an issue in this project's repository

## Next Steps

After setup is complete:

1. Read `INTEGRATION_GUIDE.md` for user documentation
2. Read `DATABASE_README.md` for API documentation
3. Start using the app and enjoy synced flashcards! 🎉
