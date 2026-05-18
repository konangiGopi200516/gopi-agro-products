import * as admin from 'firebase-admin';
import { createRequire } from 'module';

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Read from Vercel Environment Variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
    });
    console.log('🔥 Firebase Admin initialized via Environment Variable');
  } else {
    // Read from local file
    const require = createRequire(import.meta.url);
    const serviceAccount = require('../../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
    });
    console.log('🔥 Firebase Admin initialized via local JSON file');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  admin.initializeApp({
    databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
  });
}

export const db = admin.database();
export const auth = admin.auth();
