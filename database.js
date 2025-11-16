// IndexedDB Database Manager for Flashcard Categories
class FlashcardDatabase {
    constructor() {
        this.dbName = 'FiszkiDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    const categoryStore = db.createObjectStore('categories', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    categoryStore.createIndex('name', 'name', { unique: true });
                    categoryStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Words store
                if (!db.objectStoreNames.contains('words')) {
                    const wordStore = db.createObjectStore('words', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    wordStore.createIndex('categoryId', 'categoryId', { unique: false });
                    wordStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    // Category Management
    async addCategory(name, description = '', languagePair = { lang1: 'Language 1', lang2: 'Language 2' }) {
        const transaction = this.db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        const category = {
            name: name.trim(),
            description: description.trim(),
            languagePair,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: 0
        };

        return new Promise((resolve, reject) => {
            const request = store.add(category);
            request.onsuccess = () => resolve({ ...category, id: request.result });
            request.onerror = () => reject(request.error);
        });
    }

    async getAllCategories() {
        const transaction = this.db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getCategory(id) {
        const transaction = this.db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateCategory(id, updates) {
        const category = await this.getCategory(id);
        if (!category) throw new Error('Category not found');

        const transaction = this.db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        const updatedCategory = {
            ...category,
            ...updates,
            id,
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(updatedCategory);
            request.onsuccess = () => resolve(updatedCategory);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCategory(id) {
        // Delete all words in this category first
        await this.deleteWordsByCategory(id);

        const transaction = this.db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Word Management
    async addWord(categoryId, word1, pronunciation1, word2, pronunciation2) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        const wordPair = {
            categoryId,
            lang1: {
                word: word1.trim(),
                pronunciation: pronunciation1 ? pronunciation1.trim() : ''
            },
            lang2: {
                word: word2.trim(),
                pronunciation: pronunciation2 ? pronunciation2.trim() : ''
            },
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(wordPair);
            request.onsuccess = async () => {
                const newWord = { ...wordPair, id: request.result };
                // Update category word count
                await this.updateCategoryWordCount(categoryId);
                resolve(newWord);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getWordsByCategory(categoryId) {
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const index = store.index('categoryId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(categoryId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async importWordsToCategory(categoryId, wordPairs) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        const promises = wordPairs.map(wordPair => {
            const word = {
                categoryId,
                lang1: wordPair.lang1,
                lang2: wordPair.lang2,
                createdAt: new Date().toISOString()
            };

            return new Promise((resolve, reject) => {
                const request = store.add(word);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });

        await Promise.all(promises);
        await this.updateCategoryWordCount(categoryId);
        return promises.length;
    }

    async deleteWord(id) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = async () => {
                const word = getRequest.result;
                if (word) {
                    const deleteRequest = store.delete(id);
                    deleteRequest.onsuccess = async () => {
                        await this.updateCategoryWordCount(word.categoryId);
                        resolve();
                    };
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteWordsByCategory(categoryId) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        const index = store.index('categoryId');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(IDBKeyRange.only(categoryId));
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateCategoryWordCount(categoryId) {
        const words = await this.getWordsByCategory(categoryId);
        await this.updateCategory(categoryId, { wordCount: words.length });
    }

    // Export/Import functionality
    async exportCategory(categoryId) {
        const category = await this.getCategory(categoryId);
        const words = await this.getWordsByCategory(categoryId);

        return {
            category: {
                name: category.name,
                description: category.description,
                languagePair: category.languagePair
            },
            words: words.map(w => ({
                lang1: w.lang1,
                lang2: w.lang2
            })),
            exportedAt: new Date().toISOString(),
            version: 1
        };
    }

    async importCategoryFromJSON(jsonData) {
        const { category, words } = jsonData;

        // Create category
        const newCategory = await this.addCategory(
            category.name,
            category.description,
            category.languagePair
        );

        // Import words
        await this.importWordsToCategory(newCategory.id, words);

        return newCategory;
    }

    // Statistics
    async getStatistics() {
        const categories = await this.getAllCategories();
        const totalCategories = categories.length;
        const totalWords = categories.reduce((sum, cat) => sum + cat.wordCount, 0);

        return {
            totalCategories,
            totalWords,
            categories: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                wordCount: cat.wordCount
            }))
        };
    }

    // Migration from localStorage
    async migrateFromLocalStorage() {
        const oldData = localStorage.getItem('fiszki_words');
        if (!oldData) return null;

        const words = JSON.parse(oldData);
        if (words.length === 0) return null;

        // Create a "Imported from Old Version" category
        const category = await this.addCategory(
            'Imported from Previous Version',
            'Words automatically migrated from localStorage',
            { lang1: 'Language 1', lang2: 'Language 2' }
        );

        // Import all old words
        await this.importWordsToCategory(category.id, words);

        // Clear old data (optional - uncomment if you want to remove it)
        // localStorage.removeItem('fiszki_words');

        return category;
    }

    // Clear all data
    async clearAllData() {
        const transaction = this.db.transaction(['categories', 'words'], 'readwrite');
        await Promise.all([
            new Promise((resolve, reject) => {
                const request = transaction.objectStore('categories').clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }),
            new Promise((resolve, reject) => {
                const request = transaction.objectStore('words').clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            })
        ]);
    }
}

// Export for use in other files
window.FlashcardDatabase = FlashcardDatabase;
