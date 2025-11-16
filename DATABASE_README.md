# Fiszki Database System

## Overview

The Fiszki app now includes a robust category-based database system using **IndexedDB**, allowing you to organize your flashcards into different categories (e.g., "Unit 1", "Daily Phrases", "Greek Gods", etc.).

## Features

### ✨ Category Management

- **Create multiple categories** for different word lists
- **Organize by topic, difficulty, or source**
- **Track word counts** per category
- **Set language pairs** for each category

### 📊 Database Structure

The database uses IndexedDB with two main stores:

1. **Categories Store**

   - id (auto-increment)
   - name (unique)
   - description
   - languagePair (lang1, lang2)
   - wordCount
   - createdAt
   - updatedAt

2. **Words Store**
   - id (auto-increment)
   - categoryId (foreign key)
   - lang1 { word, pronunciation }
   - lang2 { word, pronunciation }
   - createdAt

## Usage Guide

### 1. Managing Categories

Open `categories.html` to access the category management interface:

```bash
# Open in browser
open categories.html
```

**Features:**

- **Create Category**: Add new categories with custom names and language pairs
- **View Statistics**: See total categories and words at a glance
- **Export/Import**: Share categories as JSON files
- **Delete**: Remove categories and all associated words

### 2. Integrating with Your Main App

To use the database in your main application (`app.js`), follow these steps:

#### Step 1: Include the database script

```html
<!-- Add this in your index.html before app.js -->
<script src="database.js"></script>
<script src="app.js"></script>
```

#### Step 2: Initialize the database

```javascript
// In your app initialization
const db = new FlashcardDatabase();
await db.init();
```

#### Step 3: Basic operations

```javascript
// Create a category
const category = await db.addCategory("Unit 1", "Basic vocabulary", {
  lang1: "Polish",
  lang2: "English",
});

// Add words to category
await db.addWord(
  category.id,
  "Dzień dobry", // word1
  "", // pronunciation1
  "Hello", // word2
  "" // pronunciation2
);

// Get all words from a category
const words = await db.getWordsByCategory(category.id);

// Import CSV words to category
const parsedWords = CSVParser.parse(csvText);
await db.importWordsToCategory(category.id, parsedWords);
```

## API Reference

### FlashcardDatabase Class

#### Initialization

```javascript
const db = new FlashcardDatabase();
await db.init();
```

#### Category Methods

**addCategory(name, description, languagePair)**

```javascript
const category = await db.addCategory("Unit 1", "First chapter vocabulary", {
  lang1: "Polish",
  lang2: "Italian",
});
```

**getAllCategories()**

```javascript
const categories = await db.getAllCategories();
```

**getCategory(id)**

```javascript
const category = await db.getCategory(1);
```

**updateCategory(id, updates)**

```javascript
await db.updateCategory(1, {
  description: "Updated description",
});
```

**deleteCategory(id)**

```javascript
await db.deleteCategory(1); // Also deletes all words
```

#### Word Methods

**addWord(categoryId, word1, pronunciation1, word2, pronunciation2)**

```javascript
await db.addWord(
  1, // categoryId
  "Dzień dobry", // word1
  "jen dob-ri", // pronunciation1
  "Buongiorno", // word2
  "bwon-jor-no" // pronunciation2
);
```

**getWordsByCategory(categoryId)**

```javascript
const words = await db.getWordsByCategory(1);
```

**importWordsToCategory(categoryId, wordPairs)**

```javascript
const wordPairs = [
  {
    lang1: { word: "Hello", pronunciation: "" },
    lang2: { word: "Ciao", pronunciation: "chao" },
  },
];
await db.importWordsToCategory(1, wordPairs);
```

**deleteWord(id)**

```javascript
await db.deleteWord(wordId);
```

#### Export/Import

**exportCategory(categoryId)**

```javascript
const exportData = await db.exportCategory(1);
// Returns JSON object ready for download
```

**importCategoryFromJSON(jsonData)**

```javascript
const jsonData = {
  category: {
    name: "Imported Category",
    description: "From backup",
    languagePair: { lang1: "Polish", lang2: "English" },
  },
  words: [
    /* word pairs */
  ],
};
const newCategory = await db.importCategoryFromJSON(jsonData);
```

#### Utility Methods

**getStatistics()**

```javascript
const stats = await db.getStatistics();
// Returns: { totalCategories, totalWords, categories: [...] }
```

**migrateFromLocalStorage()**

```javascript
const migratedCategory = await db.migrateFromLocalStorage();
// Imports old localStorage data into a new category
```

**clearAllData()**

```javascript
await db.clearAllData();
// WARNING: Deletes everything!
```

## Migration from Old System

If you have existing data in localStorage (from the old `WordDatabase` class), you can migrate it:

1. Open `categories.html`
2. Click "Migrate Old Data"
3. Your old words will be imported into a new category called "Imported from Previous Version"

Or programmatically:

```javascript
const db = new FlashcardDatabase();
await db.init();
const category = await db.migrateFromLocalStorage();
```

## Data Export Format

Exported categories use this JSON structure:

```json
{
  "category": {
    "name": "Unit 1",
    "description": "Basic phrases",
    "languagePair": {
      "lang1": "Polish",
      "lang2": "Italian"
    }
  },
  "words": [
    {
      "lang1": {
        "word": "Dzień dobry",
        "pronunciation": ""
      },
      "lang2": {
        "word": "Buongiorno",
        "pronunciation": "bwon-jor-no"
      }
    }
  ],
  "exportedAt": "2025-11-16T10:30:00.000Z",
  "version": 1
}
```

## Example Integration Flow

Here's a complete workflow example:

```javascript
// 1. Initialize
const db = new FlashcardDatabase();
await db.init();

// 2. Create categories for different topics
const unit1 = await db.addCategory(
  "Unit 1 - Greetings",
  "Basic greetings and courtesy phrases",
  { lang1: "Polish", lang2: "Italian" }
);

const mythology = await db.addCategory(
  "Greek Mythology",
  "Names of Greek gods and goddesses",
  { lang1: "English", lang2: "Greek" }
);

// 3. Import words from CSV
const csvText = await loadCSVFile();
const parsedWords = CSVParser.parse(csvText);
await db.importWordsToCategory(unit1.id, parsedWords);

// 4. Practice with a specific category
const words = await db.getWordsByCategory(unit1.id);
// Use words for flashcard practice

// 5. Export for backup
const exportData = await db.exportCategory(unit1.id);
downloadAsJSON(exportData, "unit1_backup.json");
```

## Benefits Over localStorage

1. **Better Organization**: Categories separate different word lists
2. **Scalability**: IndexedDB handles larger datasets efficiently
3. **Structured Queries**: Index-based searching for better performance
4. **Relationships**: Foreign keys link words to categories
5. **Reliability**: Transaction-based operations ensure data consistency
6. **Offline-first**: Works completely offline like localStorage

## Browser Compatibility

IndexedDB is supported in all modern browsers:

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## Next Steps

To fully integrate the database into your main app:

1. Update `index.html` to include `database.js`
2. Replace `WordDatabase` with `FlashcardDatabase` in `app.js`
3. Add category selector to the import tab
4. Update flashcard/test tabs to filter by category
5. Add a link to `categories.html` in the navigation

Would you like me to create an integration guide for your existing `app.js`?
