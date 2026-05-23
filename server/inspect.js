const admin = require("firebase-admin");

const serviceAccount = require("./firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://farmer-friendly-web-app-default-rtdb.firebaseio.com"
  });
}

async function run() {
  const email = "gopikonangi8@gmail.com";
  console.log(`Generating programmatic password reset link for: ${email}...`);
  try {
    const link = await admin.auth().generatePasswordResetLink(email);
    console.log(`✅ Success! Reset Link:`);
    console.log(link);
  } catch (error) {
    console.error("Failed to generate link:", error);
  }

  process.exit(0);
}

run().catch(console.error);
