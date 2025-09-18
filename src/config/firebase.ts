import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// Note: Analytics is not available in server-side environments
// import { getAnalytics } from 'firebase/analytics';

// Environment variables with fallbacks for development
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'dummy-auth-domain',
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || 'https://dummy-database-url.firebaseio.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'dummy-project-id',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'dummy-storage-bucket',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'dummy-messaging-sender-id',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'dummy-app-id',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'dummy-measurement-id'
};

// Only initialize analytics in browser environment
let analytics;
try {
  // Dynamically import analytics only in browser
  if (typeof window !== 'undefined') {
    import('firebase/analytics').then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    }).catch(() => {
      console.log('Analytics not available in this environment');
    });
  }
} catch (error) {
  console.log('Error initializing analytics:', error);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const database = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { analytics };

export default app;