const admin = require("firebase-admin");

const serviceAccount = require("./firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://farmer-friendly-web-app-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

async function run() {
  const snapshot = await db.ref("products").once("value");
  const data = snapshot.val();
  if (data) {
    for (const key of Object.keys(data)) {
      if (data[key].name.toLowerCase().includes("kiwi")) {
        console.log("Kiwi product found:", JSON.stringify(data[key], null, 2));
      }
    }
  }
  process.exit(0);
}

run().catch(console.error);
