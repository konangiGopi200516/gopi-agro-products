const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

const serviceAccount = require("./firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://farmer-friendly-web-app-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

async function run() {
  const email = "gopikonangi882@gmail.com";
  const password = "KisanMart2026!";
  const name = "Gopi Konangi Test";
  const phone = "+917842239788";

  console.log(`Starting programmatic registration for: ${email}...`);

  try {
    // 1. Create user in Firebase Authentication
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`User already exists in Firebase Auth with UID: ${userRecord.uid}. Re-using existing user.`);
    } catch (authError) {
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
        phoneNumber: phone,
        emailVerified: true
      });
      console.log(`✅ Successfully created user in Firebase Auth! UID: ${userRecord.uid}`);
    }

    // 2. Hash password for DB (KisanMart uses bcrypt)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Write user details to Realtime Database /users
    const userRef = db.ref(`users/${userRecord.uid}`);
    await userRef.set({
      id: userRecord.uid,
      name: name,
      email: email,
      phone: phone,
      password: passwordHash,
      role: "user",
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });

    console.log(`✅ Successfully registered and seeded user in Realtime Database at /users/${userRecord.uid}!`);
  } catch (error) {
    console.error("❌ Registration failed:", error);
  }

  process.exit(0);
}

run().catch(console.error);
