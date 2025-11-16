# Fiszki - Language Learning App

A web application for learning foreign language words through flashcards and interactive tests, with cloud sync and community sharing features.

## ✨ Key Features

### 📱 **Offline-First with Cloud Sync**
- Works offline - all data stored locally in IndexedDB
- Optional cloud sync with Supabase (when logged in)
- Automatic sync when back online
- Queue system for offline changes

### 📚 **Category Management**
- Organize words into categories (e.g., "Unit 1", "Travel Phrases")
- Create unlimited categories with descriptions
- Track word counts and creation dates
- Import/export categories as JSON

### 🌍 **Shared Word Lists** ⭐ NEW
- Share your categories publicly with the community
- Browse public categories from other users
- Import categories (full copy with all words)
- Search and sort public library
- Private by default, make public with one click
- See badges: 🔒 Private, 🌍 Public, 📥 Imported

### 1. **Import Words**

- Upload CSV files with word pairs
- Auto-detects column format based on header row
- Supports with/without pronunciation columns
- Manual word entry option

#### CSV Format Examples:

**With Header:**

```csv
Polish | Polish_spelling | English | English_spelling
Dzień dobry | | Hello |
Dziękuję | | Thank you | thank-you
```

**Without Header (2 columns):**

```csv
Dzień dobry | Buongiorno (buon-dżor-no)
Dziękuję | Grazie (gra-cje)
```

**Without Header (4 columns):**

```csv
Polish word | polish pronunciation | English word | english pronunciation
```

### 2. **Flashcards**

- Click cards to flip and reveal translations
- Navigate with Previous/Next buttons
- Shuffle option for random learning
- Shows pronunciations when available

### 3. **Word List**

- View all word pairs at once
- See both languages side-by-side
- Clean, organized layout

### 4. **Create Test**

- **Select Words**: Choose which words to include in your test
- **Test Direction**:
  - Language 1 → Language 2
  - Language 2 → Language 1
  - Mixed (both directions)
- **Test Type**:
  - Multiple Choice (choose from 3-5 options)
  - Text Input (type the answer)
- **Results & Statistics**:
  - Score and percentage
  - Detailed review of each question
  - Shows correct answers for mistakes

## How to Use

1. **Open the App**: Open `index.html` in your web browser
2. **Sign Up (Optional)**: Create an account to enable cloud sync and sharing
3. **Create Categories**: 
   - Click "Manage Categories" 
   - Create categories to organize your words
4. **Import Words**:
   - Go to "Import Words" tab
   - Upload your CSV file OR add words manually
5. **Study with Flashcards**:
   - Go to "Flashcards" tab
   - Click cards to flip
   - Use Previous/Next to navigate
6. **Share Your Lists** ⭐ NEW:
   - Go to Category Management
   - Click "🌍 Make Public" on any category
   - Others can now import your category from the Public Library
7. **Import from Community**:
   - Click "🌍 Public Library" tab
   - Browse, search, and import categories from other users
8. **Create a Test**:
   - Go to "Create Test" tab
   - Select which words to test
   - Choose test settings (direction, type)
   - Start the test!

## 🚀 Getting Started with Sharing

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for:
- Database schema setup (one-time)
- Testing the sharing features
- Troubleshooting tips

## Storage

- **Local**: IndexedDB (offline-first, always available)
- **Cloud**: Supabase PostgreSQL (when logged in)
- **Sync**: Automatic bidirectional sync with conflict resolution

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## Tips

- Start with flashcards to learn new words
- Use mixed direction tests to challenge yourself
- Multiple choice tests are easier for beginners
- Text input tests help with spelling practice
