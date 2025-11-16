# Shared Lists Feature - Deployment Guide

## ✅ Completed Implementation

Both backend and frontend are complete:
- ✅ IndexedDB v2 migration (automatic on first load)
- ✅ Supabase API methods (setCategoryVisibility, getPublicCategories, importCategory, etc.)
- ✅ Sync manager with offline support
- ✅ UI with tabs, badges, and import functionality

## 🗄️ Database Schema Update Required

The Supabase database needs to be updated with the new schema. You must apply `schema-shared.sql` to your Supabase project.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `schema-shared.sql` from this repository
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link to your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Apply the migration
supabase db push
```

### What the Schema Does

The `schema-shared.sql` file will:
- ✅ Add `visibility` column to `categories` table (private/public/shared)
- ✅ Create `category_imports` table to track imported categories
- ✅ Create indexes for performance
- ✅ Update RLS (Row Level Security) policies to allow viewing public categories
- ✅ Create `public_categories` view for easy querying
- ✅ Enable RLS on the new table

**Important**: This migration is **safe** and **backward compatible**:
- Existing categories will default to `visibility = 'private'`
- No data will be lost
- The app will continue to work even if schema is not applied (visibility features just won't sync to cloud)

## 🧪 Testing the Feature

### 1. Local Database (IndexedDB)
The local database will automatically upgrade to v2 on first page load. No action needed.

### 2. Test Visibility Toggle

1. Open `categories.html`
2. Create a new category (or use existing)
3. Click **"🌍 Make Public"** button
4. Badge should change from **"🔒 Private"** to **"🌍 Public"**
5. Refresh the page - badge should persist

### 3. Test Public Library

1. Click the **"🌍 Public Library"** tab
2. You should see all public categories (including your own public ones)
3. Try the search box to filter by name
4. Try the sort dropdown (Most Recent / Alphabetical)

### 4. Test Import

1. In Public Library tab, find a public category
2. Click **"📥 Import"** button
3. Confirm the import
4. Go back to **"My Categories"** tab
5. You should see the imported category with **"📥 Imported"** badge
6. Try importing the same category again - should show "already imported" message

### 5. Test Offline Support

1. Open DevTools → Network tab → Throttling → Offline
2. Try to make a category public
3. Should show success message (queued for sync)
4. Check sync queue: `localStorage.getItem('syncQueue')`
5. Go back online
6. The change should sync automatically

### 6. Test Duplicate Prevention

1. Import a public category
2. Try to import it again
3. Should show: "You have already imported this category!"

## 🔍 Verification Checklist

- [ ] Schema applied to Supabase (check `categories` table has `visibility` column)
- [ ] Can create private categories (default)
- [ ] Can toggle category to public
- [ ] Public categories appear in Public Library tab
- [ ] Can search public categories
- [ ] Can import public categories
- [ ] Imported categories show "📥 Imported" badge
- [ ] Cannot import same category twice
- [ ] Visibility changes work offline and sync when online
- [ ] Imported categories are fully independent (deleting original doesn't affect import)

## 🐛 Troubleshooting

### "Failed to change visibility"
- Check if you're logged in (auth panel in top-right)
- Check browser console for errors
- Verify schema was applied to Supabase

### "No public categories yet"
- Make sure you've made at least one category public
- Check that schema was applied (RLS policies updated)
- Verify you're logged in

### Import button disabled / "✓ Imported" showing incorrectly
- Clear IndexedDB: DevTools → Application → IndexedDB → delete `fiszki-db`
- Refresh page
- Check `category_imports` table in Supabase

### Visibility not syncing to cloud
- Check network tab for errors
- Verify you're logged in to Supabase
- Check `syncQueue` in localStorage
- Try logging out and back in

## 📊 Monitoring

### Check Sync Queue
```javascript
// In browser console
JSON.parse(localStorage.getItem('syncQueue') || '[]')
```

### Check Local Database
```javascript
// In browser console
const request = indexedDB.open('fiszki-db', 2);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction(['categories'], 'readonly');
  const store = tx.objectStore('categories');
  store.getAll().onsuccess = (e) => console.log(e.target.result);
};
```

### Check Supabase
```sql
-- In Supabase SQL Editor

-- View all public categories
SELECT * FROM public_categories;

-- View category imports
SELECT * FROM category_imports;

-- Check visibility distribution
SELECT visibility, COUNT(*) 
FROM categories 
GROUP BY visibility;
```

## 🚀 Next Steps (Optional Enhancements)

### Phase 3 Features (Future)
- Preview dialog before importing (show sample words)
- Pagination for Public Library (currently loads 50)
- Filter by language pair
- Sort by word count
- "Recently imported" section
- Import history view

### Performance Optimizations
- Virtual scrolling for large lists
- Lazy loading of public categories
- Caching of public categories
- Debounced search

### Analytics (Optional)
- Track most imported categories
- Track most active sharers
- Popular language pairs

## 📝 Notes

- **Privacy**: Only category names, descriptions, and word content are visible in public categories. User emails/identities are NOT shared.
- **Ownership**: Imported categories are full copies. The importer has complete control and the original owner cannot modify imports.
- **Deletion**: Deleting an original public category does NOT affect any imports made by other users.
- **Storage**: Each user's categories are stored independently. Importing does not create a "link" but a complete copy.

## 🔐 Security

All security is handled by Supabase RLS policies:
- Users can only modify their own categories
- Users can view their own private categories
- Users can view anyone's public categories
- Users cannot delete or modify other users' categories
- Category imports are tracked per user to prevent duplicates

The implementation is secure and follows Supabase best practices.
