// Supabase Cloud Database Wrapper for Fiszki App
// Requires Supabase client library

class SupabaseFlashcardDatabase {
    constructor(supabaseUrl, supabaseKey) {
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase client library not loaded. Please include the Supabase JS library.');
        }
        
        this.supabase = supabase.createClient(supabaseUrl, supabaseKey);
        this.currentUser = null;
    }

    async init() {
        // Get current user session
        const { data: { session } } = await this.supabase.auth.getSession();
        
        if (session) {
            this.currentUser = session.user;
            return true;
        }
        
        return false;
    }

    // Authentication Methods
    async signUp(email, password) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        this.currentUser = data.user;
        return data;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
        this.currentUser = null;
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;
        return user;
    }

    // Category Management
    async addCategory(name, description = '', languagePair = { lang1: 'Language 1', lang2: 'Language 2' }) {
        const { data, error } = await this.supabase
            .from('categories')
            .insert({
                name: name.trim(),
                description: description.trim(),
                lang1: languagePair.lang1,
                lang2: languagePair.lang2,
                user_id: this.currentUser.id
            })
            .select()
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            languagePair: {
                lang1: data.lang1,
                lang2: data.lang2
            },
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            wordCount: 0
        };
    }

    async getAllCategories() {
        // Get categories with word counts
        const { data, error } = await this.supabase
            .from('categories')
            .select('*, words(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            languagePair: {
                lang1: cat.lang1,
                lang2: cat.lang2
            },
            createdAt: cat.created_at,
            updatedAt: cat.updated_at,
            wordCount: cat.words[0]?.count || 0
        }));
    }

    async getCategory(id) {
        const { data, error } = await this.supabase
            .from('categories')
            .select('*, words(count)')
            .eq('id', id)
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            languagePair: {
                lang1: data.lang1,
                lang2: data.lang2
            },
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            wordCount: data.words[0]?.count || 0
        };
    }

    async updateCategory(id, updates) {
        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (updates.name) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.languagePair) {
            updateData.lang1 = updates.languagePair.lang1;
            updateData.lang2 = updates.languagePair.lang2;
        }

        const { data, error } = await this.supabase
            .from('categories')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            languagePair: {
                lang1: data.lang1,
                lang2: data.lang2
            },
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    async deleteCategory(id) {
        // Delete category (words will be cascade deleted)
        const { error } = await this.supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // Word Management
    async addWord(categoryId, word1, pronunciation1, word2, pronunciation2) {
        const { data, error } = await this.supabase
            .from('words')
            .insert({
                category_id: categoryId,
                user_id: this.currentUser.id,
                word1: word1.trim(),
                pronunciation1: pronunciation1 ? pronunciation1.trim() : '',
                word2: word2.trim(),
                pronunciation2: pronunciation2 ? pronunciation2.trim() : ''
            })
            .select()
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            categoryId: data.category_id,
            lang1: {
                word: data.word1,
                pronunciation: data.pronunciation1 || ''
            },
            lang2: {
                word: data.word2,
                pronunciation: data.pronunciation2 || ''
            },
            createdAt: data.created_at
        };
    }

    async getWordsByCategory(categoryId) {
        const { data, error } = await this.supabase
            .from('words')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        return data.map(word => ({
            id: word.id,
            categoryId: word.category_id,
            lang1: {
                word: word.word1,
                pronunciation: word.pronunciation1 || ''
            },
            lang2: {
                word: word.word2,
                pronunciation: word.pronunciation2 || ''
            },
            createdAt: word.created_at
        }));
    }

    async importWordsToCategory(categoryId, wordPairs) {
        const wordsToInsert = wordPairs.map(wordPair => ({
            category_id: categoryId,
            user_id: this.currentUser.id,
            word1: wordPair.lang1.word,
            pronunciation1: wordPair.lang1.pronunciation || '',
            word2: wordPair.lang2.word,
            pronunciation2: wordPair.lang2.pronunciation || ''
        }));

        const { data, error } = await this.supabase
            .from('words')
            .insert(wordsToInsert)
            .select();

        if (error) throw error;
        return data.length;
    }

    async deleteWord(id) {
        const { error } = await this.supabase
            .from('words')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async deleteWordsByCategory(categoryId) {
        const { error } = await this.supabase
            .from('words')
            .delete()
            .eq('category_id', categoryId);

        if (error) throw error;
    }

    async updateCategoryWordCount(categoryId) {
        // Word count is calculated automatically via the query
        // This method is kept for compatibility
        return;
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
        if (words && words.length > 0) {
            await this.importWordsToCategory(newCategory.id, words);
        }

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

    // Real-time subscriptions
    subscribeToCategories(callback) {
        return this.supabase
            .channel('categories_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'categories',
                    filter: `user_id=eq.${this.currentUser.id}`
                }, 
                callback
            )
            .subscribe();
    }

    subscribeToWords(categoryId, callback) {
        return this.supabase
            .channel(`words_changes_${categoryId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'words',
                    filter: `category_id=eq.${categoryId}`
                }, 
                callback
            )
            .subscribe();
    }

    unsubscribe(subscription) {
        if (subscription) {
            this.supabase.removeChannel(subscription);
        }
    }

    // Clear all data (for testing)
    async clearAllData() {
        // Delete all categories (words will cascade)
        const { error } = await this.supabase
            .from('categories')
            .delete()
            .eq('user_id', this.currentUser.id);

        if (error) throw error;
    }
}

// Export for use in other files
window.SupabaseFlashcardDatabase = SupabaseFlashcardDatabase;
