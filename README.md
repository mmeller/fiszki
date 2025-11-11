# Fiszki - Language Learning App

A web application for learning foreign language words through flashcards and interactive tests.

## Features

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
2. **Import Words**:
   - Go to "Import Words" tab
   - Upload your CSV file OR add words manually
3. **Study with Flashcards**:
   - Go to "Flashcards" tab
   - Click cards to flip
   - Use Previous/Next to navigate
4. **Create a Test**:
   - Go to "Create Test" tab
   - Select which words to test
   - Choose test settings (direction, type)
   - Start the test!

## Storage

All data is stored in your browser's localStorage, so your words persist between sessions.

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## Tips

- Start with flashcards to learn new words
- Use mixed direction tests to challenge yourself
- Multiple choice tests are easier for beginners
- Text input tests help with spelling practice
