// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_CONFIG = {
    url: 'https://imohtksvibyiekyclvyd.supabase.co', // e.g., 'https://xyzcompany.supabase.co'
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltb2h0a3N2aWJ5aWVreWNsdnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTczNTUsImV4cCI6MjA3ODg5MzM1NX0.DgEwhoxG5A_wNo-jccARMjg-CpoogCaC0haLeQ-VWLo' // Your public anon key
};

// Sync Configuration
const SYNC_CONFIG = {
    mode: 'auto', // 'auto', 'manual', or 'offline-only'
    autoSyncInterval: 60000, // Auto-sync every 60 seconds when in 'auto' mode
    retryDelay: 5000, // Retry failed syncs after 5 seconds
    maxRetries: 3 // Maximum number of retry attempts
};
