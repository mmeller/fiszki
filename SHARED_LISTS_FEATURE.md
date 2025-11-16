# Shared Word Lists Feature Specification

## Overview

This feature allows users to share their flashcard categories with other users, creating a community library of word lists. Users can discover and import shared categories while maintaining their own private collections.

## User Stories

### As a User, I want to:

1. **Make my categories public** so other users can learn from my word lists
2. **Browse public categories** to find interesting word lists to study
3. **Import public categories** into my own collection (creates a copy)
4. **See which of my categories are private vs public** with clear visual indicators
5. **Keep some categories private** for personal study
6. **Avoid duplicate imports** - system prevents importing the same category twice

## Visibility Modes

### 1. Private (Default)

- **Who can see**: Only the owner
- **Use case**: Personal study lists, work-in-progress
- **Icon**: 🔒
- **Color**: Gray

### 2. Public

- **Who can see**: All logged-in users
- **Who can import**: All logged-in users
- **Use case**: Completed, high-quality word lists to share
- **Icon**: 🌍
- **Color**: Green

### 3. Shared (Future)

- **Reserved for future features** like:
  - Share with specific users
  - Share via link

## Database Schema

### Enhanced Categories Table

```sql
categories:
- id (existing)
- user_id (existing)
- name (existing)
- description (existing)
- lang1, lang2 (existing)
- visibility: 'private' | 'public' | 'shared' (NEW)
- created_at, updated_at (existing)
```

### New Tables

#### category_imports

Tracks which users imported which categories:

```sql
- id
- original_category_id (references categories)
- imported_by_user_id (references auth.users)
- imported_category_id (references categories - the user's copy)
- imported_at
```

## Row Level Security (RLS) Updates

### Categories

```sql
-- Users can see:
-- 1. Their own categories (any visibility)
-- 2. All public/shared categories from any user
SELECT: user_id = auth.uid() OR visibility IN ('public', 'shared')

-- Users can only modify their own
INSERT/UPDATE/DELETE: user_id = auth.uid()
```

### Words

```sql
-- Users can see:
-- 1. Words in their own categories
-- 2. Words in public/shared categories
SELECT: user_id = auth.uid() OR category_id IN (public categories)

-- Users can only modify their own
INSERT/UPDATE/DELETE: user_id = auth.uid()
```

## UI Changes

### 1. Categories Management Page (categories.html)

#### Category Card Enhancements

```html
<div class="category-card">
  <div class="category-header">
    <span class="visibility-badge"> 🔒 Private / 🌍 Public </span>
    <h3>Category Name</h3>
  </div>

  <!-- Existing content -->

  <div class="category-actions">
    <!-- Existing buttons -->

    <!-- NEW: Visibility toggle for own categories -->
    <button class="btn-visibility">Make Public / Make Private</button>
  </div>
</div>
```

#### New Tab: "Browse Public Categories"

```html
<div class="tabs">
  <button>My Categories</button>
  <button>Public Library</button>
  <!-- NEW -->
</div>

<div class="public-library">
  <input type="search" placeholder="Search public categories..." />

  <div class="filters">
    <select name="sort">
      <option>Most Recent</option>
      <option>Alphabetical</option>
    </select>
  </div>

  <div class="public-categories-grid">
    <div class="public-category-card">
      <span class="visibility-badge">🌍 Public</span>
      <h3>Greek Gods</h3>
      <p class="description">Complete list of Greek mythology gods...</p>

      <div class="stats">
        <span>📚 45 words</span>
        <span>🌐 Greek → English</span>
      </div>

      <div class="actions">
        <button class="btn-import">Import to My List</button>
        <button class="btn-preview">👁️ Preview</button>
      </div>
    </div>
  </div>
</div>
```

### 2. Main App (index.html)

#### Category Selector Enhancement

```html
<select id="category-select">
  <option value="1">🔒 My Private Category (30)</option>
  <option value="2">🌍 My Public Category (50)</option>
  <option value="3">📥 Imported: Greek Gods (45)</option>
</select>
```

## API Methods (to add to supabase-db.js)

### Category Visibility

```javascript
// Change category visibility
async setCategoryVisibility(categoryId, visibility) {
  // 'private', 'public', or 'shared'
}

// Get public categories with pagination
async getPublicCategories(page = 1, limit = 20, sortBy = 'recent') {
  // Returns list of public categories
}

// Search public categories
async searchPublicCategories(query) {
  // Search by name, description
}
```

### Category Import

```javascript
// Import a public category (creates a copy)
async importCategory(originalCategoryId) {
  // 1. Check if already imported
  // 2. Copy category to user's collection
  // 3. Copy all words
  // 4. Record in category_imports
  // Returns: new category object
}

// Check if user has imported a category
async hasImportedCategory(categoryId) {
  // Returns: boolean
}
```

## User Flows

### Making a Category Public

1. User goes to "Manage Categories"
2. Finds their category
3. Clicks "Make Public" button
4. Dialog appears:

   ```
   Make "Greek Gods" public?

   ✓ Other users can view and import this category
   ✓ You can still edit it (affects only future imports)
   ✓ You can make it private again anytime

   [Optional] Set display name: [Your Name]

   [Cancel] [Make Public]
   ```

5. Category gets 🌍 badge
6. Appears in public library

### Browsing and Importing

1. User goes to "Manage Categories"
2. Clicks "Public Library" tab
3. Sees grid of public categories
4. Can filter/sort:
   - Most Recent
   - Alphabetical
5. Clicks "Preview" to see words without importing
6. Clicks "Import" to add to their collection:

   ```
   Import "Greek Gods"?

   This will create a copy in your collection with 45 words.
   You can edit your copy without affecting the original.

   [Cancel] [Import]
   ```

7. Category appears in their list with 📥 indicator
8. Cannot import the same category twice (button disabled if already imported)

## Implementation Priority

### Phase 1: Core Sharing (MVP)

- [ ] Add visibility column to database
- [ ] Update RLS policies
- [ ] Add visibility toggle in UI
- [ ] Show visibility badges on categories
- [ ] Implement setCategoryVisibility()

### Phase 2: Public Library

- [ ] Create category_imports table
- [ ] Implement importCategory()
- [ ] Build Public Library tab UI
- [ ] Add search and basic filters
- [ ] Prevent duplicate imports

### Phase 3: Enhanced Discovery

- [ ] Category preview dialog
- [ ] Better search (fuzzy matching)
- [ ] Sort by word count
- [ ] Filter by language pairs

## Security Considerations

### 1. Content Moderation

- No automatic content filtering (Phase 1)
- Future: Report button + admin review

### 2. Spam Prevention

- Rate limit: Max 10 public categories per user (optional)
- Rate limit: Max 100 imports per day per user (optional)

### 3. Privacy

- User email never exposed
- Only category name and description are public
- Users can make categories private anytime

### 4. Data Integrity

- Imported categories are **copies** (not references)
- Original owner can't modify imported copies
- Imported copies are fully owned by the importer
- Deleting original doesn't affect imports

## Sync Manager Updates

The HybridSyncManager needs to handle:

1. **Visibility changes** - sync to cloud immediately
2. **Importing categories** - multi-step operation:
   - Create local category
   - Copy all words
   - Create cloud category
   - Copy all cloud words
   - Record import
3. **Offline mode** - queue public library operations

## UI/UX Best Practices

### Visual Indicators

- 🔒 Private - Gray badge
- 🌍 Public - Green badge
- 📥 Imported - Blue badge

### Badges

```css
.badge-private {
  background: #718096;
  color: white;
}
.badge-public {
  background: #48bb78;
  color: white;
}
.badge-imported {
  background: #4299e1;
  color: white;
}
```

### Empty States

```
Public Library Tab (no categories):
🌍 No public categories yet
Be the first to share! Make one of your categories public.
```

```
My Categories (none imported):
📚 You haven't imported any categories yet
Check out the Public Library to find interesting word lists!
```

## Testing Checklist

### Basic Functionality

- [ ] Make category public
- [ ] Make category private
- [ ] Import public category
- [ ] Search public categories
- [ ] Sort public categories

### Edge Cases

- [ ] Import same category twice (should prevent/warn)
- [ ] Make imported category public (allowed)
- [ ] Delete original after others imported (imports persist)
- [ ] Owner edits public category (doesn't affect imports)
- [ ] Offline mode (queue operations)

### Security

- [ ] Can't access other users' private categories
- [ ] Can't modify other users' categories
- [ ] RLS policies work correctly

### Performance

- [ ] Public library loads quickly
- [ ] Search is responsive
- [ ] Import handles large categories (1000+ words)
- [ ] Pagination works

## Future Enhancements

### Discovery

- Trending categories (most imported recently)
- Recommended for you (based on imports)
- Tags/topics (Grammar, Vocabulary, Idioms, etc.)
- Language pair filtering (Greek→English, etc.)

### Collaboration

- Share via link (view-only link to category)
- Version history
- Category collections/bundles

## Conclusion

This feature transforms Fiszki from a personal study tool into a community learning platform while maintaining privacy and user control. Users can:

- ✅ Keep categories private by default
- ✅ Share valuable word lists with the community
- ✅ Discover and import quality content
- ✅ Avoid duplicate imports

The implementation is modular and can be built incrementally, with Phase 1 providing core value and subsequent phases adding discovery features.
