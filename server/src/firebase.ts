import * as admin from 'firebase-admin';
import { createRequire } from 'module';

// Using the provided service account key if available
try {
  const require = createRequire(import.meta.url);
  const serviceAccount = require('../../firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
  });
  console.log('🔥 Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  // Fallback to default application credentials if running in a Google Cloud environment
  admin.initializeApp({
    databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
  });
}

export const db = admin.database();
export const auth = admin.auth();
