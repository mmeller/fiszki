// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // e.g., 'https://xyzcompany.supabase.co'
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Your public anon key
};

// Sync Configuration
const SYNC_CONFIG = {
    mode: 'auto', // 'auto', 'manual', or 'offline-only'
    autoSyncInterval: 60000, // Auto-sync every 60 seconds when in 'auto' mode
    retryDelay: 5000, // Retry failed syncs after 5 seconds
    maxRetries: 3 // Maximum number of retry attempts
};
