// Database Management
class WordDatabase {
    constructor() {
        this.storageKey = 'fiszki_words';
        this.words = this.loadWords();
    }

    loadWords() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveWords() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.words));
    }

    addWord(word1, pronunciation1, word2, pronunciation2) {
        const wordPair = {
            id: Date.now(),
            lang1: {
                word: word1.trim(),
                pronunciation: pronunciation1 ? pronunciation1.trim() : ''
            },
            lang2: {
                word: word2.trim(),
                pronunciation: pronunciation2 ? pronunciation2.trim() : ''
            }
        };
        this.words.push(wordPair);
        this.saveWords();
        return wordPair;
    }

    getAllWords() {
        return this.words;
    }

    getWordCount() {
        return this.words.length;
    }

    clearAll() {
        this.words = [];
        this.saveWords();
    }

    importWords(wordPairs) {
        this.words = [...this.words, ...wordPairs];
        this.saveWords();
    }
}

// CSV Parser
class CSVParser {
    static parse(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const words = [];
        
        // Parse first line as header
        const headerParts = lines[0].split('|').map(part => part.trim().toLowerCase());
        
        // Detect column mapping based on header keywords
        const columnMapping = this.detectColumnMapping(headerParts);
        
        // If header detected, skip first line; otherwise process all lines
        const startIndex = columnMapping.hasHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split('|').map(part => part.trim());
            
            if (parts.length === 0 || !parts[0]) continue;

            let wordPair = {
                id: Date.now() + Math.random(),
                lang1: { word: '', pronunciation: '' },
                lang2: { word: '', pronunciation: '' }
            };

            if (columnMapping.hasHeader) {
                // Use detected column mapping
                wordPair.lang1.word = parts[columnMapping.lang1WordIndex] || '';
                wordPair.lang1.pronunciation = columnMapping.lang1PronIndex !== -1 ? (parts[columnMapping.lang1PronIndex] || '') : '';
                wordPair.lang2.word = parts[columnMapping.lang2WordIndex] || '';
                wordPair.lang2.pronunciation = columnMapping.lang2PronIndex !== -1 ? (parts[columnMapping.lang2PronIndex] || '') : '';
            } else {
                // Fallback: auto-detect format without header
                if (parts.length === 2) {
                    // Format: Word1 | Word2
                    wordPair.lang1.word = parts[0];
                    
                    // Check if second part contains pronunciation in parentheses
                    const match = parts[1].match(/^(.+?)\s*\((.+?)\)\s*$/);
                    if (match) {
                        wordPair.lang2.word = match[1].trim();
                        wordPair.lang2.pronunciation = match[2].trim();
                    } else {
                        wordPair.lang2.word = parts[1];
                    }
                } else if (parts.length === 3) {
                    // Might be: Word1 | Word2 | Pronunciation2
                    // or Word1 | Pronunciation1 | Word2
                    wordPair.lang1.word = parts[0];
                    
                    const secondPartLooksLikePronunciation = parts[1].includes('(') || parts[1].includes('-');
                    if (secondPartLooksLikePronunciation) {
                        wordPair.lang1.pronunciation = parts[1];
                        wordPair.lang2.word = parts[2];
                    } else {
                        wordPair.lang2.word = parts[1];
                        wordPair.lang2.pronunciation = parts[2];
                    }
                } else if (parts.length >= 4) {
                    // Format: Word1 | Pronunciation1 | Word2 | Pronunciation2
                    wordPair.lang1.word = parts[0];
                    wordPair.lang1.pronunciation = parts[1];
                    wordPair.lang2.word = parts[2];
                    wordPair.lang2.pronunciation = parts[3];
                }
            }

            if (wordPair.lang1.word && wordPair.lang2.word) {
                words.push(wordPair);
            }
        }

        return words;
    }

    static detectColumnMapping(headerParts) {
        const mapping = {
            hasHeader: false,
            lang1WordIndex: 0,
            lang1PronIndex: -1,
            lang2WordIndex: 1,
            lang2PronIndex: -1
        };

        // Keywords that indicate this is a header row
        const headerKeywords = [
            'polish', 'english', 'italian', 'spanish', 'french', 'german', 'russian',
            'polski', 'angielski', 'włoski', 'hiszpański', 'francuski', 'niemiecki',
            'word', 'słowo', 'translation', 'tłumaczenie',
            'pronunciation', 'wymowa', 'spelling', 'pisownia',
            'lang', 'język', 'language'
        ];

        // Check if any header part contains header keywords
        const hasHeaderKeywords = headerParts.some(part => 
            headerKeywords.some(keyword => part.includes(keyword))
        );

        if (!hasHeaderKeywords) {
            return mapping; // Not a header, use default mapping
        }

        mapping.hasHeader = true;

        // Keywords for pronunciation/spelling columns
        const pronunciationKeywords = ['pronunciation', 'wymowa', 'spelling', 'pisownia', 'pron', 'spell'];

        // Find columns
        let lang1Found = false;
        let lang2Found = false;

        for (let i = 0; i < headerParts.length; i++) {
            const header = headerParts[i];
            const isPronunciation = pronunciationKeywords.some(kw => header.includes(kw));

            if (isPronunciation) {
                if (!lang1Found) {
                    mapping.lang1PronIndex = i;
                } else if (!lang2Found || lang2Found) {
                    mapping.lang2PronIndex = i;
                }
            } else {
                // It's a word column
                if (!lang1Found) {
                    mapping.lang1WordIndex = i;
                    lang1Found = true;
                } else if (!lang2Found) {
                    mapping.lang2WordIndex = i;
                    lang2Found = true;
                }
            }
        }

        return mapping;
    }
}

// Flashcard Manager
class FlashcardManager {
    constructor(words) {
        this.words = words;
        this.currentIndex = 0;
        this.shuffled = false;
        this.displayWords = [...words];
    }

    shuffle() {
        this.displayWords = [...this.words];
        for (let i = this.displayWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.displayWords[i], this.displayWords[j]] = [this.displayWords[j], this.displayWords[i]];
        }
        this.currentIndex = 0;
        this.shuffled = true;
    }

    unShuffle() {
        this.displayWords = [...this.words];
        this.currentIndex = 0;
        this.shuffled = false;
    }

    getCurrentWord() {
        return this.displayWords[this.currentIndex];
    }

    next() {
        if (this.currentIndex < this.displayWords.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    getTotalCount() {
        return this.displayWords.length;
    }
}

// UI Controller
class UIController {
    constructor() {
        this.db = new FlashcardDatabase();
        this.currentCategoryId = null;
        this.categories = [];
        this.flashcardManager = null;
        this.currentFlashcard = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        await this.db.init();
        
        // Check if there's a selected category from categories.html
        const savedCategoryId = localStorage.getItem('selectedCategoryId');
        if (savedCategoryId) {
            this.currentCategoryId = parseInt(savedCategoryId);
            localStorage.removeItem('selectedCategoryId');
        }
        
        this.initializeElements();
        this.attachEventListeners();
        await this.loadCategories();
        await this.updateUI();
    }

    initializeElements() {
        // Tab elements
        this.tabs = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Category elements
        this.categorySelect = document.getElementById('category-select');
        this.newCategoryBtn = document.getElementById('new-category-btn');
        this.flashcardCategoryFilter = document.getElementById('flashcard-category-filter');
        this.testCategoryFilter = document.getElementById('test-category-filter');
        this.listCategoryFilter = document.getElementById('list-category-filter');

        // Import tab elements
        this.csvFileInput = document.getElementById('csv-file');
        this.importBtn = document.getElementById('import-btn');
        this.importStatus = document.getElementById('import-status');
        this.wordCountEl = document.getElementById('word-count');
        this.clearDbBtn = document.getElementById('clear-db-btn');

        // Manual add elements
        this.word1Input = document.getElementById('word1');
        this.pronunciation1Input = document.getElementById('pronunciation1');
        this.word2Input = document.getElementById('word2');
        this.pronunciation2Input = document.getElementById('pronunciation2');
        this.addWordBtn = document.getElementById('add-word-btn');

        // Flashcard elements
        this.flashcard = document.getElementById('flashcard');
        this.flashcardArea = document.getElementById('flashcard-area');
        this.noWordsMessage = document.getElementById('no-words-message');
        this.frontWord = document.getElementById('front-word');
        this.frontPronunciation = document.getElementById('front-pronunciation');
        this.backWord = document.getElementById('back-word');
        this.backPronunciation = document.getElementById('back-pronunciation');
        this.prevCardBtn = document.getElementById('prev-card');
        this.nextCardBtn = document.getElementById('next-card');
        this.currentCardEl = document.getElementById('current-card');
        this.totalCardsEl = document.getElementById('total-cards');
        this.shuffleCheckbox = document.getElementById('shuffle-cards');

        // Word list elements
        this.wordList = document.getElementById('word-list');
        this.noWordsListMessage = document.getElementById('no-words-list-message');
        this.wordListActions = document.getElementById('word-list-actions');
        this.selectAllWordsBtn = document.getElementById('select-all-words-btn');
        this.deselectAllWordsBtn = document.getElementById('deselect-all-words-btn');
        this.deleteSelectedWordsBtn = document.getElementById('delete-selected-words-btn');
        this.selectedCountEl = document.getElementById('selected-count');

        // Test elements
        this.testSetup = document.getElementById('test-setup');
        this.testConfigArea = document.getElementById('test-config-area');
        this.noWordsTestMessage = document.getElementById('no-words-test-message');
        this.wordSelectionList = document.getElementById('word-selection-list');
        this.selectAllBtn = document.getElementById('select-all-btn');
        this.deselectAllBtn = document.getElementById('deselect-all-btn');
        this.startTestBtn = document.getElementById('start-test-btn');
        this.testArea = document.getElementById('test-area');
        this.currentQuestionEl = document.getElementById('current-question');
        this.totalQuestionsEl = document.getElementById('total-questions');
        this.testScoreEl = document.getElementById('test-score');
        this.testTotalEl = document.getElementById('test-total');
        this.questionText = document.getElementById('question-text');
        this.questionPronunciation = document.getElementById('question-pronunciation');
        this.multipleChoiceArea = document.getElementById('multiple-choice-area');
        this.textInputArea = document.getElementById('text-input-area');
        this.choicesEl = document.getElementById('choices');
        this.answerInput = document.getElementById('answer-input');
        this.submitAnswerBtn = document.getElementById('submit-answer-btn');
        this.feedbackEl = document.getElementById('feedback');
        this.nextQuestionBtn = document.getElementById('next-question-btn');
        this.finishTestBtn = document.getElementById('finish-test-btn');
        this.testResults = document.getElementById('test-results');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalPercentageEl = document.getElementById('final-percentage');
        this.finalCorrectEl = document.getElementById('final-correct');
        this.finalWrongEl = document.getElementById('final-wrong');
        this.resultsDetailsEl = document.getElementById('results-details');
        this.newTestBtn = document.getElementById('new-test-btn');

        this.currentTest = null;
    }

    attachEventListeners() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Category management
        this.categorySelect.addEventListener('change', (e) => {
            this.currentCategoryId = e.target.value ? parseInt(e.target.value) : null;
            this.updateUI();
        });
        
        this.newCategoryBtn.addEventListener('click', () => this.createNewCategory());
        
        this.flashcardCategoryFilter.addEventListener('change', () => {
            this.initializeFlashcards();
        });
        
        this.testCategoryFilter.addEventListener('change', () => {
            this.initializeTest();
        });
        
        this.listCategoryFilter.addEventListener('change', () => {
            this.renderWordList();
        });

        // Word list management
        this.selectAllWordsBtn.addEventListener('click', () => this.selectAllWordsList());
        this.deselectAllWordsBtn.addEventListener('click', () => this.deselectAllWordsList());
        this.deleteSelectedWordsBtn.addEventListener('click', () => this.deleteSelectedWords());

        // Import functionality
        this.importBtn.addEventListener('click', () => this.importCSV());
        
        // Manual add
        this.addWordBtn.addEventListener('click', () => this.addWordManually());

        // Clear database
        this.clearDbBtn.addEventListener('click', () => this.clearDatabase());

        // Flashcard controls
        this.flashcard.addEventListener('click', () => this.flipCard());
        this.prevCardBtn.addEventListener('click', () => this.previousCard());
        this.nextCardBtn.addEventListener('click', () => this.nextCard());
        this.shuffleCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.flashcardManager.shuffle();
            } else {
                this.flashcardManager.unShuffle();
            }
            this.updateFlashcard();
        });

        // Test controls
        this.selectAllBtn.addEventListener('click', () => this.selectAllWords());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllWords());
        this.startTestBtn.addEventListener('click', () => this.startTest());
        this.submitAnswerBtn.addEventListener('click', () => this.submitTextAnswer());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitTextAnswer();
            }
        });
        this.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        this.finishTestBtn.addEventListener('click', () => this.finishTest());
        this.newTestBtn.addEventListener('click', () => this.newTest());

        // Show/hide choice count based on test type
        const testTypeRadios = document.querySelectorAll('input[name="test-type"]');
        testTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const choiceCountOption = document.getElementById('choice-count-option');
                if (e.target.value === 'multiple-choice') {
                    choiceCountOption.style.display = 'block';
                } else {
                    choiceCountOption.style.display = 'none';
                }
            });
        });
    }

    async loadCategories() {
        this.categories = await this.db.getAllCategories();
        this.updateCategorySelects();
    }

    updateCategorySelects() {
        // Update import category select
        if (this.categories.length === 0) {
            this.categorySelect.innerHTML = '<option value="">No categories - Create one first</option>';
            this.categorySelect.disabled = true;
        } else {
            this.categorySelect.disabled = false;
            this.categorySelect.innerHTML = this.categories.map(cat => 
                `<option value="${cat.id}" ${this.currentCategoryId === cat.id ? 'selected' : ''}>
                    ${cat.name} (${cat.wordCount} words)
                </option>`
            ).join('');
            
            // Select first category if none selected
            if (!this.currentCategoryId && this.categories.length > 0) {
                this.currentCategoryId = this.categories[0].id;
                this.categorySelect.value = this.currentCategoryId;
            }
        }

        // Update flashcard filter
        this.flashcardCategoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            this.categories.map(cat => 
                `<option value="${cat.id}">${cat.name} (${cat.wordCount} words)</option>`
            ).join('');

        // Update test filter
        this.testCategoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            this.categories.map(cat => 
                `<option value="${cat.id}">${cat.name} (${cat.wordCount} words)</option>`
            ).join('');

        // Update list filter
        this.listCategoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            this.categories.map(cat => 
                `<option value="${cat.id}">${cat.name} (${cat.wordCount} words)</option>`
            ).join('');
    }

    async createNewCategory() {
        const name = prompt('Enter category name:');
        if (!name || !name.trim()) return;

        const description = prompt('Enter description (optional):') || '';
        const lang1 = prompt('Language 1 name:', 'Language 1') || 'Language 1';
        const lang2 = prompt('Language 2 name:', 'Language 2') || 'Language 2';

        try {
            const category = await this.db.addCategory(name, description, { lang1, lang2 });
            this.currentCategoryId = category.id;
            await this.loadCategories();
            await this.updateUI();
            this.showStatus(`Category "${name}" created successfully!`, 'success');
        } catch (error) {
            if (error.message.includes('unique')) {
                this.showStatus('A category with this name already exists.', 'error');
            } else {
                this.showStatus('Failed to create category: ' + error.message, 'error');
            }
        }
    }

    switchTab(tabName) {
        // Update active tab button
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update active tab content
        this.tabContents.forEach(content => {
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Refresh content if needed
        if (tabName === 'flashcards') {
            this.initializeFlashcards();
        } else if (tabName === 'list') {
            this.renderWordList();
        } else if (tabName === 'test') {
            this.initializeTest();
        }
    }

    importCSV() {
        if (!this.currentCategoryId) {
            this.showStatus('Please select or create a category first.', 'error');
            return;
        }

        const file = this.csvFileInput.files[0];
        if (!file) {
            this.showStatus('Please select a CSV file first.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const csvText = e.target.result;
                const words = CSVParser.parse(csvText);
                
                if (words.length === 0) {
                    this.showStatus('No valid word pairs found in the CSV file.', 'error');
                    return;
                }

                await this.db.importWordsToCategory(this.currentCategoryId, words);
                this.showStatus(`Successfully imported ${words.length} word pairs!`, 'success');
                await this.loadCategories();
                await this.updateUI();
                this.csvFileInput.value = '';
            } catch (error) {
                this.showStatus(`Error parsing CSV: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }

    addWordManually() {
        if (!this.currentCategoryId) {
            this.showStatus('Please select or create a category first.', 'error');
            return;
        }

        const word1 = this.word1Input.value.trim();
        const word2 = this.word2Input.value.trim();

        if (!word1 || !word2) {
            this.showStatus('Please enter both words.', 'error');
            return;
        }

        const pronunciation1 = this.pronunciation1Input.value.trim();
        const pronunciation2 = this.pronunciation2Input.value.trim();

        this.db.addWord(this.currentCategoryId, word1, pronunciation1, word2, pronunciation2)
            .then(() => {
                this.showStatus('Word pair added successfully!', 'success');
                
                // Clear inputs
                this.word1Input.value = '';
                this.pronunciation1Input.value = '';
                this.word2Input.value = '';
                this.pronunciation2Input.value = '';

                return this.loadCategories();
            })
            .then(() => this.updateUI());
    }

    clearDatabase() {
        if (!this.currentCategoryId) {
            if (confirm('Are you sure you want to delete ALL categories and words? This cannot be undone.')) {
                this.db.clearAllData()
                    .then(() => {
                        this.showStatus('All data has been deleted.', 'success');
                        this.currentCategoryId = null;
                        return this.loadCategories();
                    })
                    .then(() => this.updateUI());
            }
        } else {
            this.db.getCategory(this.currentCategoryId)
                .then(category => {
                    if (confirm(`Are you sure you want to delete all words in "${category.name}"? This cannot be undone.`)) {
                        return this.db.deleteWordsByCategory(this.currentCategoryId);
                    }
                })
                .then(() => {
                    if (this.currentCategoryId) {
                        return this.db.updateCategoryWordCount(this.currentCategoryId);
                    }
                })
                .then(() => {
                    this.showStatus('All words in category have been deleted.', 'success');
                    return this.loadCategories();
                })
                .then(() => this.updateUI())
                .catch(err => {
                    if (err) {
                        console.error('Error deleting words:', err);
                    }
                });
        }
    }

    showStatus(message, type) {
        this.importStatus.textContent = message;
        this.importStatus.className = `status ${type}`;
        setTimeout(() => {
            this.importStatus.textContent = '';
            this.importStatus.className = 'status';
        }, 5000);
    }

    async updateUI() {
        if (this.currentCategoryId) {
            const words = await this.db.getWordsByCategory(this.currentCategoryId);
            this.wordCountEl.textContent = words.length;
        } else {
            const stats = await this.db.getStatistics();
            this.wordCountEl.textContent = stats.totalWords;
        }
    }

    async initializeFlashcards() {
        const filterValue = this.flashcardCategoryFilter.value;
        let words;

        if (filterValue === 'all') {
            // Get all words from all categories
            const allCategories = await this.db.getAllCategories();
            const wordPromises = allCategories.map(cat => this.db.getWordsByCategory(cat.id));
            const wordArrays = await Promise.all(wordPromises);
            words = wordArrays.flat();
        } else {
            words = await this.db.getWordsByCategory(parseInt(filterValue));
        }
        
        if (words.length === 0) {
            this.noWordsMessage.classList.remove('hidden');
            this.flashcardArea.classList.add('hidden');
            return;
        }

        this.noWordsMessage.classList.add('hidden');
        this.flashcardArea.classList.remove('hidden');

        this.flashcardManager = new FlashcardManager(words);
        if (this.shuffleCheckbox.checked) {
            this.flashcardManager.shuffle();
        }
        
        this.updateFlashcard();
    }

    updateFlashcard() {
        if (!this.flashcardManager) return;

        const word = this.flashcardManager.getCurrentWord();
        
        // Update front (Language 1)
        this.frontWord.textContent = word.lang1.word;
        this.frontPronunciation.textContent = word.lang1.pronunciation;

        // Update back (Language 2)
        this.backWord.textContent = word.lang2.word;
        this.backPronunciation.textContent = word.lang2.pronunciation;

        // Update counter
        this.currentCardEl.textContent = this.flashcardManager.getCurrentIndex() + 1;
        this.totalCardsEl.textContent = this.flashcardManager.getTotalCount();

        // Reset flip state
        this.flashcard.classList.remove('flipped');
    }

    flipCard() {
        this.flashcard.classList.toggle('flipped');
    }

    nextCard() {
        if (this.flashcardManager.next()) {
            this.updateFlashcard();
        }
    }

    previousCard() {
        if (this.flashcardManager.previous()) {
            this.updateFlashcard();
        }
    }

    async renderWordList() {
        const filterValue = this.listCategoryFilter.value;
        let words;

        if (filterValue === 'all') {
            // Get all words from all categories
            const allCategories = await this.db.getAllCategories();
            const wordPromises = allCategories.map(cat => this.db.getWordsByCategory(cat.id));
            const wordArrays = await Promise.all(wordPromises);
            words = wordArrays.flat();
        } else {
            words = await this.db.getWordsByCategory(parseInt(filterValue));
        }
        
        if (words.length === 0) {
            this.noWordsListMessage.classList.remove('hidden');
            this.wordListActions.classList.add('hidden');
            this.wordList.innerHTML = '';
            return;
        }

        this.noWordsListMessage.classList.add('hidden');
        this.wordListActions.classList.remove('hidden');
        
        this.wordList.innerHTML = words.map(word => `
            <div class="word-item" style="display: flex; align-items: center; gap: 15px;">
                <input type="checkbox" class="word-list-checkbox" data-word-id="${word.id}" style="cursor: pointer; width: 18px; height: 18px;" />
                <div style="flex: 1; display: flex; justify-content: space-between;">
                    <div class="word-column">
                        <div class="word">${word.lang1.word}</div>
                        ${word.lang1.pronunciation ? `<div class="pronunciation">${word.lang1.pronunciation}</div>` : ''}
                    </div>
                    <div class="word-column">
                        <div class="word">${word.lang2.word}</div>
                        ${word.lang2.pronunciation ? `<div class="pronunciation">${word.lang2.pronunciation}</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to checkboxes
        const checkboxes = document.querySelectorAll('.word-list-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => this.updateSelectedCount());
        });

        this.updateSelectedCount();
    }

    selectAllWordsList() {
        const checkboxes = document.querySelectorAll('.word-list-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
        this.updateSelectedCount();
    }

    deselectAllWordsList() {
        const checkboxes = document.querySelectorAll('.word-list-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const checkboxes = document.querySelectorAll('.word-list-checkbox');
        const checkedCount = document.querySelectorAll('.word-list-checkbox:checked').length;
        this.selectedCountEl.textContent = checkedCount > 0 ? `${checkedCount} selected` : '';
    }

    async deleteSelectedWords() {
        const checkedCheckboxes = document.querySelectorAll('.word-list-checkbox:checked');
        
        if (checkedCheckboxes.length === 0) {
            alert('Please select at least one word to delete.');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${checkedCheckboxes.length} word(s)? This cannot be undone.`)) {
            return;
        }

        try {
            const wordIds = Array.from(checkedCheckboxes).map(cb => parseInt(cb.dataset.wordId));
            
            // Delete each word
            for (const wordId of wordIds) {
                await this.db.deleteWord(wordId);
            }

            // Reload categories and re-render
            await this.loadCategories();
            await this.updateUI();
            await this.renderWordList();
            
            this.showStatus(`Successfully deleted ${wordIds.length} word(s).`, 'success');
        } catch (error) {
            console.error('Error deleting words:', error);
            this.showStatus('Failed to delete words: ' + error.message, 'error');
        }
    }

    async initializeTest() {
        const filterValue = this.testCategoryFilter.value;
        let words;

        if (filterValue === 'all') {
            // Get all words from all categories
            const allCategories = await this.db.getAllCategories();
            const wordPromises = allCategories.map(cat => this.db.getWordsByCategory(cat.id));
            const wordArrays = await Promise.all(wordPromises);
            words = wordArrays.flat();
        } else {
            words = await this.db.getWordsByCategory(parseInt(filterValue));
        }
        
        if (words.length === 0) {
            this.noWordsTestMessage.classList.remove('hidden');
            this.testConfigArea.classList.add('hidden');
            return;
        }

        this.noWordsTestMessage.classList.add('hidden');
        this.testConfigArea.classList.remove('hidden');

        this.renderWordSelectionList(words);
    }

    renderWordSelectionList(words) {
        this.wordSelectionList.innerHTML = words.map(word => `
            <div class="word-select-item">
                <input type="checkbox" class="word-checkbox" data-word-id="${word.id}" checked />
                <div class="word-select-content">
                    <div class="word-select-lang">
                        <span class="word">${word.lang1.word}</span>
                        ${word.lang1.pronunciation ? `<span class="pronunciation">${word.lang1.pronunciation}</span>` : ''}
                    </div>
                    <div class="word-select-lang">
                        <span class="word">${word.lang2.word}</span>
                        ${word.lang2.pronunciation ? `<span class="pronunciation">${word.lang2.pronunciation}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectAllWords() {
        const checkboxes = document.querySelectorAll('.word-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
    }

    deselectAllWords() {
        const checkboxes = document.querySelectorAll('.word-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
    }

    async startTest() {
        const allCheckboxes = document.querySelectorAll('.word-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.word-checkbox:checked');
        
        if (allCheckboxes.length === 0) {
            alert('Error: No checkboxes found. Please go back to Import Words and add some words first.');
            return;
        }
        
        if (checkedCheckboxes.length === 0) {
            alert('Please select at least one word for the test.');
            return;
        }

        const selectedIds = Array.from(checkedCheckboxes).map(cb => parseFloat(cb.dataset.wordId));
        
        // Get words from the filtered category
        const filterValue = this.testCategoryFilter.value;
        let allWords;

        if (filterValue === 'all') {
            const allCategories = await this.db.getAllCategories();
            const wordPromises = allCategories.map(cat => this.db.getWordsByCategory(cat.id));
            const wordArrays = await Promise.all(wordPromises);
            allWords = wordArrays.flat();
        } else {
            allWords = await this.db.getWordsByCategory(parseInt(filterValue));
        }

        const selectedWords = allWords.filter(word => selectedIds.includes(word.id));

        const direction = document.querySelector('input[name="test-direction"]:checked').value;
        const testType = document.querySelector('input[name="test-type"]:checked').value;
        const choiceCount = parseInt(document.getElementById('choice-count').value);

        this.currentTest = new TestManager(selectedWords, direction, testType, choiceCount, allWords);
        
        this.testSetup.classList.add('hidden');
        this.testArea.classList.remove('hidden');
        
        this.displayQuestion();
    }

    displayQuestion() {
        const question = this.currentTest.getCurrentQuestion();
        
        if (!question) {
            alert('Error: No question available. Please try again.');
            this.newTest();
            return;
        }

        this.currentQuestionEl.textContent = this.currentTest.currentQuestionIndex + 1;
        this.totalQuestionsEl.textContent = this.currentTest.totalQuestions;
        this.testScoreEl.textContent = this.currentTest.score;
        this.testTotalEl.textContent = this.currentTest.currentQuestionIndex;

        this.questionText.textContent = question.questionWord;
        this.questionPronunciation.textContent = question.questionPronunciation || '';

        this.feedbackEl.classList.add('hidden');
        this.nextQuestionBtn.classList.add('hidden');
        this.finishTestBtn.classList.add('hidden');

        if (this.currentTest.testType === 'multiple-choice') {
            this.multipleChoiceArea.classList.remove('hidden');
            this.textInputArea.classList.add('hidden');
            this.displayMultipleChoice(question);
        } else {
            this.multipleChoiceArea.classList.add('hidden');
            this.textInputArea.classList.remove('hidden');
            this.answerInput.value = '';
            this.answerInput.classList.remove('correct', 'wrong');
            this.answerInput.disabled = false;
            this.answerInput.focus();
        }
    }

    displayMultipleChoice(question) {
        this.choicesEl.innerHTML = question.choices.map((choice, index) => `
            <button class="choice-btn" data-choice="${choice}">${choice}</button>
        `).join('');

        const choiceButtons = this.choicesEl.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectChoice(btn));
        });
    }

    selectChoice(button) {
        const choice = button.dataset.choice;
        const isCorrect = this.currentTest.checkAnswer(choice);
        
        const allButtons = this.choicesEl.querySelectorAll('.choice-btn');
        allButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.choice === this.currentTest.getCurrentQuestion().correctAnswer) {
                btn.classList.add('correct');
            } else if (btn === button && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        this.showFeedback(isCorrect);
    }

    submitTextAnswer() {
        const answer = this.answerInput.value.trim();
        if (!answer) {
            alert('Please enter an answer.');
            return;
        }

        const isCorrect = this.currentTest.checkAnswer(answer);
        this.answerInput.disabled = true;
        this.answerInput.classList.add(isCorrect ? 'correct' : 'wrong');
        
        this.showFeedback(isCorrect);
    }

    showFeedback(isCorrect) {
        const question = this.currentTest.getCurrentQuestion();
        
        this.feedbackEl.classList.remove('hidden', 'correct', 'wrong');
        this.feedbackEl.classList.add(isCorrect ? 'correct' : 'wrong');
        
        if (isCorrect) {
            this.feedbackEl.innerHTML = '✓ Correct!';
        } else {
            this.feedbackEl.innerHTML = `
                ✗ Wrong!
                <div class="correct-answer">
                    Correct answer: <strong>${question.correctAnswer}</strong>
                    ${question.correctPronunciation ? `<br><em>${question.correctPronunciation}</em>` : ''}
                </div>
            `;
        }

        this.testScoreEl.textContent = this.currentTest.score;
        this.testTotalEl.textContent = this.currentTest.currentQuestionIndex;

        if (this.currentTest.hasNextQuestion()) {
            this.nextQuestionBtn.classList.remove('hidden');
        } else {
            this.finishTestBtn.classList.remove('hidden');
        }
    }

    nextQuestion() {
        this.currentTest.nextQuestion();
        this.displayQuestion();
    }

    finishTest() {
        this.testArea.classList.add('hidden');
        this.testResults.classList.remove('hidden');
        
        const results = this.currentTest.getResults();
        
        this.finalScoreEl.textContent = `${results.score} / ${results.total}`;
        this.finalPercentageEl.textContent = `${results.percentage}%`;
        this.finalCorrectEl.textContent = results.correct;
        this.finalWrongEl.textContent = results.wrong;

        this.resultsDetailsEl.innerHTML = results.questions.map(q => `
            <div class="result-item ${q.isCorrect ? 'correct' : 'wrong'}">
                <div class="result-question">
                    <div class="result-word">${q.question.questionWord}</div>
                    ${q.question.questionPronunciation ? `<div class="result-pronunciation">${q.question.questionPronunciation}</div>` : ''}
                </div>
                <div class="result-answer">
                    <div class="result-word">${q.question.correctAnswer}</div>
                    ${q.question.correctPronunciation ? `<div class="result-pronunciation">${q.question.correctPronunciation}</div>` : ''}
                    ${!q.isCorrect ? `<div class="your-answer">Your answer: ${q.userAnswer}</div>` : ''}
                </div>
                <div class="result-status ${q.isCorrect ? 'correct' : 'wrong'}">
                    ${q.isCorrect ? '✓' : '✗'}
                </div>
            </div>
        `).join('');
    }

    newTest() {
        this.testResults.classList.add('hidden');
        this.testSetup.classList.remove('hidden');
        this.initializeTest();
    }
}

// Test Manager
class TestManager {
    constructor(words, direction, testType, choiceCount, allWords) {
        this.words = words;
        this.direction = direction;
        this.testType = testType;
        this.choiceCount = choiceCount;
        this.allWords = allWords;
        
        this.questions = this.generateQuestions();
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
    }

    generateQuestions() {
        const questions = [];

        for (let word of this.words) {
            if (this.direction === 'mixed') {
                // Add both directions
                questions.push(this.createQuestion(word, 'lang1-to-lang2'));
                questions.push(this.createQuestion(word, 'lang2-to-lang1'));
            } else {
                questions.push(this.createQuestion(word, this.direction));
            }
        }

        // Shuffle questions
        return this.shuffleArray(questions);
    }

    createQuestion(word, direction) {
        const question = {
            word: word,
            direction: direction
        };

        if (direction === 'lang1-to-lang2') {
            question.questionWord = word.lang1.word;
            question.questionPronunciation = word.lang1.pronunciation;
            question.correctAnswer = word.lang2.word;
            question.correctPronunciation = word.lang2.pronunciation;
        } else {
            question.questionWord = word.lang2.word;
            question.questionPronunciation = word.lang2.pronunciation;
            question.correctAnswer = word.lang1.word;
            question.correctPronunciation = word.lang1.pronunciation;
        }

        if (this.testType === 'multiple-choice') {
            question.choices = this.generateChoices(question, direction);
        }

        return question;
    }

    generateChoices(question, direction) {
        const choices = [question.correctAnswer];
        const wrongChoices = [];

        // Get wrong answers from other words
        for (let word of this.allWords) {
            if (word.id !== question.word.id) {
                const wrongAnswer = direction === 'lang1-to-lang2' ? word.lang2.word : word.lang1.word;
                if (!choices.includes(wrongAnswer) && wrongAnswer) {
                    wrongChoices.push(wrongAnswer);
                }
            }
        }

        // Shuffle wrong choices
        const shuffledWrong = this.shuffleArray(wrongChoices);
        
        const neededChoices = Math.min(this.choiceCount - 1, shuffledWrong.length);
        choices.push(...shuffledWrong.slice(0, neededChoices));

        return this.shuffleArray(choices);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    }

    checkAnswer(userAnswer) {
        const question = this.getCurrentQuestion();
        const isCorrect = this.normalizeAnswer(userAnswer) === this.normalizeAnswer(question.correctAnswer);
        
        if (isCorrect) {
            this.score++;
        }

        this.answers.push({
            question: question,
            userAnswer: userAnswer,
            isCorrect: isCorrect
        });

        return isCorrect;
    }

    normalizeAnswer(answer) {
        return answer.toLowerCase().trim();
    }

    hasNextQuestion() {
        return this.currentQuestionIndex < this.questions.length - 1;
    }

    nextQuestion() {
        this.currentQuestionIndex++;
    }

    getResults() {
        return {
            score: this.score,
            total: this.questions.length,
            correct: this.score,
            wrong: this.questions.length - this.score,
            percentage: Math.round((this.score / this.questions.length) * 100),
            questions: this.answers
        };
    }

    get totalQuestions() {
        return this.questions.length;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
});
