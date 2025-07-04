'use client';

// Re-export everything from the main firebase setup to ensure a single instance.
// This prevents authentication state mismatches between different parts of the app.
export * from './firebase';
