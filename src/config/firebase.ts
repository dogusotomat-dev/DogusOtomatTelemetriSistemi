import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Environment variables validation and logging
const requiredEnvVars = {
  REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
  REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  REACT_APP_FIREBASE_DATABASE_URL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
  REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Log environment variables status
console.log('Environment variables status:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`${key}: ${value ? 'LOADED' : 'MISSING'}`);
  if (value) {
    console.log(`  Value: ${value.substring(0, 10)}...`);
  }
});

// Validate critical environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value && ['REACT_APP_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_DATABASE_URL'].includes(key))
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMsg = `Critical Firebase environment variables are missing: ${missingVars.join(', ')}. Please check your .env file and restart the development server.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const firebaseConfig = {
  apiKey: requiredEnvVars.REACT_APP_FIREBASE_API_KEY,
  authDomain: requiredEnvVars.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: requiredEnvVars.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: requiredEnvVars.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: requiredEnvVars.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnvVars.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnvVars.REACT_APP_FIREBASE_APP_ID,
  measurementId: requiredEnvVars.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Debug: Log the final config (remove in production)
console.log('Firebase config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const database = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;