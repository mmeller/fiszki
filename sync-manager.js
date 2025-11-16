// Hybrid Sync Manager - Handles offline/online synchronization
// between local IndexedDB and cloud Supabase

class HybridSyncManager {
    constructor(localDB, cloudDB) {
        this.localDB = localDB;  // FlashcardDatabase (IndexedDB)
        this.cloudDB = cloudDB;  // SupabaseFlashcardDatabase
        this.isOnline = navigator.onLine;
        this.isSyncing = false;
        this.syncQueue = [];
        this.syncMode = localStorage.getItem('syncMode') || 'auto'; // 'auto', 'manual', 'offline-only'
        
        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('Network online');
            this.isOnline = true;
            if (this.syncMode === 'auto') {
                this.syncAll();
            }
        });

        window.addEventListener('offline', () => {
            console.log('Network offline');
            this.isOnline = false;
        });
    }

    setSyncMode(mode) {
        this.syncMode = mode;
        localStorage.setItem('syncMode', mode);
    }

    getSyncMode() {
        return this.syncMode;
    }

    async init() {
        await this.localDB.init();
        
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                const isAuthenticated = await this.cloudDB.init();
                if (isAuthenticated && this.syncMode === 'auto') {
                    await this.syncAll();
                }
            } catch (error) {
                console.error('Cloud DB init failed:', error);
            }
        }
    }

    // Category Operations with sync
    async addCategory(name, description, languagePair) {
        // Always save locally first
        const localCategory = await this.localDB.addCategory(name, description, languagePair);
        
        // Try to sync to cloud if online
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                const cloudCategory = await this.cloudDB.addCategory(name, description, languagePair);
                // Store cloud ID mapping
                this.storeCategoryMapping(localCategory.id, cloudCategory.id);
                return cloudCategory;
            } catch (error) {
                console.error('Failed to sync category to cloud:', error);
                this.queueOperation('addCategory', { name, description, languagePair });
                return localCategory;
            }
        }
        
        return localCategory;
    }

    async getAllCategories() {
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                return await this.cloudDB.getAllCategories();
            } catch (error) {
                console.error('Failed to fetch from cloud, using local:', error);
            }
        }
        return await this.localDB.getAllCategories();
    }

    async getCategory(id) {
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                return await this.cloudDB.getCategory(id);
            } catch (error) {
                console.error('Failed to fetch from cloud, using local:', error);
            }
        }
        return await this.localDB.getCategory(id);
    }

    async updateCategory(id, updates) {
        // Update locally first
        const localResult = await this.localDB.updateCategory(id, updates);
        
        // Sync to cloud
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                return await this.cloudDB.updateCategory(id, updates);
            } catch (error) {
                console.error('Failed to sync update to cloud:', error);
                this.queueOperation('updateCategory', { id, updates });
                return localResult;
            }
        }
        
        return localResult;
    }

    async deleteCategory(id) {
        // Delete locally first
        await this.localDB.deleteCategory(id);
        
        // Sync to cloud
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                await this.cloudDB.deleteCategory(id);
            } catch (error) {
                console.error('Failed to sync deletion to cloud:', error);
                this.queueOperation('deleteCategory', { id });
            }
        }
    }

    // Word Operations with sync
    async addWord(categoryId, word1, pronunciation1, word2, pronunciation2) {
        // Save locally first
        const localWord = await this.localDB.addWord(categoryId, word1, pronunciation1, word2, pronunciation2);
        
        // Sync to cloud
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                const cloudWord = await this.cloudDB.addWord(categoryId, word1, pronunciation1, word2, pronunciation2);
                return cloudWord;
            } catch (error) {
                console.error('Failed to sync word to cloud:', error);
                this.queueOperation('addWord', { categoryId, word1, pronunciation1, word2, pronunciation2 });
                return localWord;
            }
        }
        
        return localWord;
    }

    async getWordsByCategory(categoryId) {
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                return await this.cloudDB.getWordsByCategory(categoryId);
            } catch (error) {
                console.error('Failed to fetch from cloud, using local:', error);
            }
        }
        return await this.localDB.getWordsByCategory(categoryId);
    }

    async importWordsToCategory(categoryId, wordPairs) {
        // Import locally first
        await this.localDB.importWordsToCategory(categoryId, wordPairs);
        
        // Sync to cloud
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                await this.cloudDB.importWordsToCategory(categoryId, wordPairs);
            } catch (error) {
                console.error('Failed to sync import to cloud:', error);
                this.queueOperation('importWordsToCategory', { categoryId, wordPairs });
            }
        }
    }

    async deleteWord(id) {
        // Delete locally first
        await this.localDB.deleteWord(id);
        
        // Sync to cloud
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                await this.cloudDB.deleteWord(id);
            } catch (error) {
                console.error('Failed to sync deletion to cloud:', error);
                this.queueOperation('deleteWord', { id });
            }
        }
    }

    async deleteWordsByCategory(categoryId) {
        // Delete locally first
        await this.localDB.deleteWordsByCategory(categoryId);
        
        // Sync to cloud
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                await this.cloudDB.deleteWordsByCategory(categoryId);
            } catch (error) {
                console.error('Failed to sync deletion to cloud:', error);
                this.queueOperation('deleteWordsByCategory', { categoryId });
            }
        }
    }

    async updateCategoryWordCount(categoryId) {
        await this.localDB.updateCategoryWordCount(categoryId);
        
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                await this.cloudDB.updateCategoryWordCount(categoryId);
            } catch (error) {
                console.error('Failed to update count in cloud:', error);
            }
        }
    }

    // Export/Import
    async exportCategory(categoryId) {
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                return await this.cloudDB.exportCategory(categoryId);
            } catch (error) {
                console.error('Failed to export from cloud, using local:', error);
            }
        }
        return await this.localDB.exportCategory(categoryId);
    }

    async importCategoryFromJSON(jsonData) {
        // Import locally first
        const localCategory = await this.localDB.importCategoryFromJSON(jsonData);
        
        // Sync to cloud
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                const cloudCategory = await this.cloudDB.importCategoryFromJSON(jsonData);
                return cloudCategory;
            } catch (error) {
                console.error('Failed to sync import to cloud:', error);
                this.queueOperation('importCategoryFromJSON', { jsonData });
                return localCategory;
            }
        }
        
        return localCategory;
    }

    // Statistics
    async getStatistics() {
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                return await this.cloudDB.getStatistics();
            } catch (error) {
                console.error('Failed to fetch stats from cloud, using local:', error);
            }
        }
        return await this.localDB.getStatistics();
    }

    // Sync Queue Management
    queueOperation(operation, params) {
        this.syncQueue.push({
            operation,
            params,
            timestamp: Date.now()
        });
        this.saveSyncQueue();
    }

    saveSyncQueue() {
        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    }

    loadSyncQueue() {
        const queue = localStorage.getItem('syncQueue');
        if (queue) {
            this.syncQueue = JSON.parse(queue);
        }
    }

    async processSyncQueue() {
        if (this.isSyncing || !this.isOnline || this.syncMode === 'offline-only') {
            return;
        }

        this.isSyncing = true;
        console.log(`Processing ${this.syncQueue.length} queued operations...`);

        const processedQueue = [];
        
        for (const item of this.syncQueue) {
            try {
                await this.executeQueuedOperation(item);
                console.log(`Synced: ${item.operation}`);
            } catch (error) {
                console.error(`Failed to sync ${item.operation}:`, error);
                processedQueue.push(item); // Keep for retry
            }
        }

        this.syncQueue = processedQueue;
        this.saveSyncQueue();
        this.isSyncing = false;
    }

    async executeQueuedOperation(item) {
        const { operation, params } = item;
        
        switch (operation) {
            case 'addCategory':
                await this.cloudDB.addCategory(params.name, params.description, params.languagePair);
                break;
            case 'updateCategory':
                await this.cloudDB.updateCategory(params.id, params.updates);
                break;
            case 'deleteCategory':
                await this.cloudDB.deleteCategory(params.id);
                break;
            case 'addWord':
                await this.cloudDB.addWord(params.categoryId, params.word1, params.pronunciation1, params.word2, params.pronunciation2);
                break;
            case 'importWordsToCategory':
                await this.cloudDB.importWordsToCategory(params.categoryId, params.wordPairs);
                break;
            case 'deleteWord':
                await this.cloudDB.deleteWord(params.id);
                break;
            case 'deleteWordsByCategory':
                await this.cloudDB.deleteWordsByCategory(params.categoryId);
                break;
            case 'importCategoryFromJSON':
                await this.cloudDB.importCategoryFromJSON(params.jsonData);
                break;
        }
    }

    // Full sync from cloud to local
    async syncAll() {
        if (!this.isOnline || this.syncMode === 'offline-only') {
            console.log('Sync skipped: offline mode');
            return;
        }

        console.log('Starting full sync...');
        this.isSyncing = true;

        try {
            // First, process any queued operations
            await this.processSyncQueue();

            // Get all cloud categories
            const cloudCategories = await this.cloudDB.getAllCategories();
            
            // Clear local database
            await this.localDB.clearAllData();
            
            // Sync each category and its words
            for (const cloudCat of cloudCategories) {
                // Add category to local
                const localCat = await this.localDB.addCategory(
                    cloudCat.name,
                    cloudCat.description,
                    cloudCat.languagePair
                );
                
                // Get words for this category
                const cloudWords = await this.cloudDB.getWordsByCategory(cloudCat.id);
                
                // Import words to local
                if (cloudWords.length > 0) {
                    await this.localDB.importWordsToCategory(localCat.id, cloudWords);
                }
            }
            
            console.log('Full sync completed');
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    // Category ID mapping helpers
    storeCategoryMapping(localId, cloudId) {
        const mappings = JSON.parse(localStorage.getItem('categoryMappings') || '{}');
        mappings[localId] = cloudId;
        localStorage.setItem('categoryMappings', JSON.stringify(mappings));
    }

    getCloudCategoryId(localId) {
        const mappings = JSON.parse(localStorage.getItem('categoryMappings') || '{}');
        return mappings[localId];
    }

    // Migration helper - migrate existing IndexedDB data to cloud
    async migrateLocalToCloud() {
        if (!this.isOnline || this.syncMode === 'offline-only') {
            throw new Error('Cannot migrate: offline or in offline-only mode');
        }

        console.log('Starting migration from local to cloud...');
        
        const localCategories = await this.localDB.getAllCategories();
        
        for (const localCat of localCategories) {
            try {
                // Create category in cloud
                const cloudCat = await this.cloudDB.addCategory(
                    localCat.name,
                    localCat.description,
                    localCat.languagePair
                );
                
                // Get local words
                const localWords = await this.localDB.getWordsByCategory(localCat.id);
                
                // Import to cloud
                if (localWords.length > 0) {
                    await this.cloudDB.importWordsToCategory(cloudCat.id, localWords);
                }
                
                console.log(`Migrated category: ${localCat.name}`);
            } catch (error) {
                console.error(`Failed to migrate category ${localCat.name}:`, error);
            }
        }
        
        console.log('Migration completed');
    }

    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            syncMode: this.syncMode,
            queueLength: this.syncQueue.length
        };
    }

    async clearAllData() {
        await this.localDB.clearAllData();
        
        if (this.isOnline && this.syncMode !== 'offline-only') {
            try {
                await this.cloudDB.clearAllData();
            } catch (error) {
                console.error('Failed to clear cloud data:', error);
            }
        }
    }
}

// Export for use in other files
window.HybridSyncManager = HybridSyncManager;
