import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// Note: Analytics is not available in server-side environments
// import { getAnalytics } from 'firebase/analytics';

// Validate that required environment variables are present
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_DATABASE_URL',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only validate environment variables in browser environment
if (isBrowser) {
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    console.warn('Missing Firebase environment variables:', missingEnvVars);
  }
}

// Environment variables - only use actual values in browser environment
const firebaseConfig = isBrowser ? {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
} : {
  // Empty config for server-side builds to avoid exposing secrets
  apiKey: undefined,
  authDomain: undefined,
  databaseURL: undefined,
  projectId: undefined,
  storageBucket: undefined,
  messagingSenderId: undefined,
  appId: undefined,
  measurementId: undefined
};

// Only initialize analytics in browser environment
let analytics;
try {
  // Dynamically import analytics only in browser
  if (isBrowser) {
    import('firebase/analytics').then(({ getAnalytics }) => {
      if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      console.log('Analytics not available in this environment');
    });
  }
} catch (error) {
  console.log('Error initializing analytics:', error);
}

// Initialize Firebase only in browser environment
let app;
let database;
let auth;
let storage;

if (isBrowser && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export { database, auth, storage, analytics, app };

export default app;