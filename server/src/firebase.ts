import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Define the mock DB behavior
class MockDbRef {
  path: string;
  constructor(p: string) { this.path = p; }
  async once(event: string) {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'mock-db.json'), 'utf8') || '{}');
    const parts = this.path.split('/').filter(Boolean);
    let current = data;
    for (const part of parts) {
      if (current) current = current[part];
    }
    
    // Support for orderByChild("email").equalTo(email)
    if (this._orderBy && this._equalTo && current) {
      const filtered: any = {};
      let found = false;
      for (const key in current) {
         if (current[key] && current[key][this._orderBy] === this._equalTo) {
             filtered[key] = current[key];
             found = true;
         }
      }
      return { exists: () => found, val: () => found ? filtered : null };
    }

    return { exists: () => current !== undefined && current !== null, val: () => current };
  }
  async set(value: any) {
    const dbPath = path.join(process.cwd(), 'mock-db.json');
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8') || '{}');
    const parts = this.path.split('/').filter(Boolean);
    let current = data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }
  async update(value: any) {
    const dbPath = path.join(process.cwd(), 'mock-db.json');
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8') || '{}');
    const parts = this.path.split('/').filter(Boolean);
    let current = data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = { ...(current[parts[parts.length - 1]] || {}), ...value };
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }
  async push(value: any) {
    const pushId = 'push_' + Date.now().toString(36);
    const newRef = new MockDbRef(this.path + '/' + pushId);
    await newRef.set(value);
    return { key: pushId };
  }
  
  _orderBy: string | null = null;
  _equalTo: string | null = null;
  orderByChild(child: string) { this._orderBy = child; return this; }
  equalTo(value: string) { this._equalTo = value; return this; }
}

let isMock = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // Attempt base64 decode if it doesn't look like raw JSON
    if (typeof serviceAccountString === 'string' && !serviceAccountString.trim().startsWith('{')) {
      try {
        const decoded = Buffer.from(serviceAccountString, 'base64').toString('utf8');
        if (decoded.trim().startsWith('{')) {
          serviceAccountString = decoded;
        }
      } catch (e) {}
    }

    const serviceAccount = typeof serviceAccountString === 'string' && serviceAccountString.trim().startsWith('{')
      ? JSON.parse(serviceAccountString)
      : serviceAccountString;
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
    const paths = [
      path.join(__dirname, '../../firebase-service-account.json'), // Local dev
      path.join(process.cwd(), 'firebase-service-account.json'),   // Vercel serverless
      path.join(__dirname, 'firebase-service-account.json')
    ];
    let serviceAccountPath = '';
    for (const p of paths) {
      if (fs.existsSync(p)) {
        serviceAccountPath = p;
        break;
      }
    }
    if (!serviceAccountPath) throw new Error('Service account file not found');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://farmer-friendly-web-app-default-rtdb.firebaseio.com'
    });
    console.log('🔥 Firebase Admin initialized via local JSON file');
  }
} catch (error: any) {
  console.warn('⚠️ Firebase Admin init error:', error.message);
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
     console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT was provided but failed to parse.');
     console.warn('First 20 chars:', process.env.FIREBASE_SERVICE_ACCOUNT.substring(0, 20));
  }
  console.warn('⚠️ Falling back to local JSON MOCK database for testing.');
  isMock = true;
  // Initialize an empty mock db if it doesn't exist
  if (!fs.existsSync(path.join(process.cwd(), 'mock-db.json'))) {
     fs.writeFileSync(path.join(process.cwd(), 'mock-db.json'), JSON.stringify({ users: {}, authLogs: {} }));
  }
}

export const db = (isMock ? { ref: (pathString: string) => new MockDbRef(pathString) } : admin.database()) as any;
export const auth = (isMock ? {} as any : admin.auth()) as any;
export { admin };
