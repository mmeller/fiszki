# Fiszki Flashcards - Quick Start Guide

## 🎯 Overview

Fiszki is a language learning flashcard application with **hybrid sync** - it works offline and can optionally sync to the cloud using Supabase.

## 🚀 Quick Start Options

### Option 1: Offline Only (No Setup Required)

1. Open `index.html` in your browser
2. Click "Continue in Offline Mode" (or just use the app directly)
3. Your data is stored locally on your device
4. Perfect for privacy-focused users or testing

### Option 2: Cloud Sync (Recommended)

1. **Set up Supabase** (one-time setup - 5 minutes)
   - Follow instructions in `SUPABASE_SETUP.md`
   - Create free Supabase account
   - Run SQL schema
   - Copy credentials to `config.js`

2. **Sign up / Sign in**
   - Open `auth.html` in your browser
   - Create an account or sign in
   - Your data will sync across devices

3. **Start learning!**
   - Create categories
   - Import word lists
   - Study with flashcards

## 📚 Features

### ✅ Available Now
- **Categories**: Organize words by topic (e.g., "Greek Gods", "Unit 1")
- **Import CSV**: Bulk import word lists with `word|pronunciation` format
- **Manual Add**: Add individual word pairs
- **Flashcards**: Study with interactive flip cards
- **Tests**: Quiz yourself with multiple choice
- **Word List**: View, search, and manage all words
- **Offline Support**: Works without internet connection
- **Cloud Sync**: Optional sync across devices (requires Supabase)

### 🔄 Sync Modes

**Auto (Recommended for online)**
- Syncs changes immediately to cloud
- Real-time updates across devices

**Manual**
- Changes saved locally first
- Manually trigger sync when ready
- Good for unstable connections

**Offline-Only**
- No cloud sync
- All data stays on your device
- Use without Supabase account

## 📁 File Structure

```
fiszki/
├── index.html              # Main application
├── auth.html               # Sign in/up page
├── categories.html         # Category management
├── app.js                  # Main app logic
├── styles.css              # Styling
│
├── database.js             # Local IndexedDB storage
├── supabase-db.js          # Cloud database wrapper
├── sync-manager.js         # Hybrid sync logic
├── config.js               # Supabase credentials (YOU MUST EDIT THIS)
│
├── schema.sql              # Database schema for Supabase
├── SUPABASE_SETUP.md       # Setup instructions
├── INTEGRATION_GUIDE.md    # User guide
├── DATABASE_README.md      # API documentation
└── README.md               # Project overview
```

## 🎓 Basic Usage

### 1. Create a Category

```
1. Click "📚 Manage Categories" or "New Category" button
2. Enter category name (e.g., "Greek Gods")
3. Optionally add description
4. Set language names (e.g., "Greek", "English")
```

### 2. Import Words

**Format**: `word1|pronunciation1|word2|pronunciation2`

Example CSV (`bogowie.csv`):
```
Greek Name|Pronunciation|English Name|Meaning
Ζεύς|Zeus|Zeus|King of gods
Ποσειδῶν|Poseidon|Poseidon|God of the sea
Ἀθηνᾶ|Athena|Athena|Goddess of wisdom
```

Steps:
```
1. Go to "Import Words" tab
2. Select your category
3. Choose CSV file
4. Click "Import CSV"
```

### 3. Study with Flashcards

```
1. Go to "Flashcards" tab
2. Filter by category (optional)
3. Click card to flip
4. Use ← → arrows to navigate
5. Toggle shuffle if desired
```

### 4. Take a Test

```
1. Go to "Test" tab
2. Filter by category (optional)
3. Click "Start Test"
4. Answer multiple choice questions
5. Get instant feedback
```

### 5. Manage Words

```
1. Go to "Word List" tab
2. Search or filter by category
3. Select words with checkboxes
4. Use "Select All" / "Deselect All"
5. Delete selected words if needed
```

## 🔐 Authentication & Sync

### First Time Setup (Cloud Sync)

1. **Configure Supabase**
   ```javascript
   // In config.js, replace with your values:
   const SUPABASE_CONFIG = {
       url: 'https://yourproject.supabase.co',
       anonKey: 'your-anon-key-here'
   };
   ```

2. **Create Account**
   - Open `auth.html`
   - Enter email and password
   - Check email for confirmation link
   - Click confirmation link

3. **Sign In**
   - Return to `auth.html`
   - Sign in with your credentials
   - You'll be redirected to main app

### Sync Status Indicators

**🟢 Green dot**: Synced - all changes saved to cloud  
**🟠 Orange dot (pulsing)**: Syncing - uploading changes  
**⚫ Gray dot**: Offline - data saved locally only

### Switching Sync Modes

```
1. Look for "🔄 Sync Mode" selector (bottom right)
2. Choose your preferred mode:
   - Auto: Immediate sync (recommended online)
   - Manual: Sync on demand
   - Offline-Only: No cloud sync
```

### Sign Out

```
1. Click your email in top right
2. Click "Sign Out"
3. App switches to offline-only mode
4. Your local data is preserved
```

## 🔧 Troubleshooting

### "Configuration missing" error

**Problem**: Can't sign in, see config error

**Solution**:
1. Open `config.js`
2. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with real values
3. Get values from Supabase Dashboard → Settings → API

### Data not syncing

**Problem**: Changes on one device don't appear on another

**Solution**:
1. Check internet connection
2. Verify you're signed in on both devices
3. Check sync mode is "Auto" (bottom right selector)
4. Try refreshing the page
5. Open browser console (F12) to check for errors

### Can't see my categories

**Problem**: Categories disappeared after signing in/out

**Solution**:
- **Signed out**: Only local data is shown
- **Signed in**: Only cloud data is shown (may be empty if new account)
- **To migrate**: See "Migrating Data" section below

### Email confirmation not received

**Problem**: No confirmation email after signup

**Solution**:
1. Check spam/junk folder
2. Wait a few minutes (can take 5-10 mins)
3. In Supabase Dashboard → Authentication → Settings:
   - Verify "Enable email confirmations" is checked
4. Try signing up with different email provider

## 📤 Migrating Data

### From Offline to Cloud

If you've been using offline mode and want to migrate to cloud:

```javascript
// 1. Sign in to the app
// 2. Open browser console (F12)
// 3. Run this command:
await uiController.syncManager.migrateLocalToCloud();
```

This will upload all your local categories and words to the cloud.

### Export Your Data

**From UI** (recommended):
1. Go to `categories.html`
2. Click "Export" next to each category
3. Saves as CSV file

**From Supabase** (if using cloud):
1. Open Supabase Dashboard → SQL Editor
2. Run:
   ```sql
   SELECT * FROM categories WHERE user_id = auth.uid();
   SELECT * FROM words WHERE user_id = auth.uid();
   ```
3. Click "Download as CSV"

## 🆘 Getting Help

### Documentation Files
- `SUPABASE_SETUP.md` - Detailed cloud setup instructions
- `INTEGRATION_GUIDE.md` - Complete user guide
- `DATABASE_README.md` - API documentation for developers

### Common Issues

**Q: Do I need Supabase to use this app?**  
A: No! The app works perfectly offline. Supabase is optional for cloud sync.

**Q: Is my data secure?**  
A: Yes. With Supabase, Row Level Security ensures you can only access your own data.

**Q: Can I use this on mobile?**  
A: Yes! Open the HTML files in your mobile browser. Works best in Chrome/Safari.

**Q: How much does this cost?**  
A: Free! Supabase free tier is more than enough for personal use.

**Q: Can I self-host?**  
A: Yes! You can host Supabase yourself or use any compatible PostgreSQL database.

## 🎉 Tips & Tricks

1. **Use Categories**: Organize words by topic, lesson, or difficulty
2. **CSV Format**: Pipe-separated (`|`) works best for import
3. **Shuffle Cards**: Enable shuffle for better memorization
4. **Offline First**: Add words offline, sync later
5. **Multiple Devices**: Sign in on phone + computer for anywhere access
6. **Pronunciation Fields**: Optional but helpful for learning
7. **Regular Backups**: Export categories periodically

## 📊 Usage Examples

### Greek Gods Study List
```csv
Greek Name|Pronunciation|English|Domain
Ζεύς|Zeus|Zeus|Sky & Thunder
Ἥρα|Hera|Hera|Marriage & Women
Ποσειδῶν|Poseidon|Poseidon|Sea & Earthquakes
Ἀθηνᾶ|Athena|Athena|Wisdom & War
```

### Language Vocabulary
```csv
Polski|Polish Pronunciation|English|Category
Cześć|cheshch|Hello|Greetings
Dziękuję|jen-koo-yeh|Thank you|Greetings
Dom|dom|House|Places
Szkoła|shkoh-wah|School|Places
```

### Technical Terms
```csv
Term|Pronunciation|Definition|Field
Algorithm||Step-by-step procedure|Computer Science
Binary||Base-2 number system|Computer Science
Cache||Fast temporary storage|Computer Science
```

## 🚀 Next Steps

1. **Try it offline**: Open `index.html` and create a category
2. **Import sample data**: Use `bogowie.csv` or `unit1.csv`
3. **Set up cloud sync**: Follow `SUPABASE_SETUP.md` (optional)
4. **Share**: Send link to friends who want to learn!

## 📝 License

This project is open source and free to use for personal learning.

---

**Ready to start learning? Open `index.html` and dive in! 🎓**
