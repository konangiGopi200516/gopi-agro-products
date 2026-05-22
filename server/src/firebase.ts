import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' && process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{')
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
    });
    console.log('🔥 Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT variable');
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "farmer-friendly-web-app",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
    });
    console.log('🔥 Firebase Admin initialized via individual FIREBASE_ variables');
  } else {
    try {
      const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
      });
      console.log('🔥 Firebase Admin initialized via local JSON file');
    } catch (localErr) {
      console.warn('⚠️ No Firebase service account file found locally. Attempting default credentials...');
      admin.initializeApp({
        databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
      });
    }
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
}

export const db = admin.database();
export const auth = admin.auth();
