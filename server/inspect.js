const admin = require("firebase-admin");

const serviceAccount = require("./firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://farmer-friendly-web-app-default-rtdb.firebaseio.com"
  });
}

async function run() {
  const apiKey = "re_YhWb7qv7_2Vk6hGhtVL8f5fyG8P7KQh4N";
  const email = "gopikonangi8@gmail.com";

  console.log(`Calling Resend API to send test email to: ${email}...`);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "KisanMart <onboarding@resend.dev>",
        to: email,
        subject: "Resend Local Diagnostic Test - KisanMart",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
            <h2 style="color: #4CAF50; text-align: center;">🌱 KisanMart Resend Local Test</h2>
            <p>Congrats! Your Resend API key is 100% active and valid!</p>
          </div>
        `
      })
    });

    const result = await response.json();
    console.log("Status Code:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Fetch failed:", error);
  }

  process.exit(0);
}

run().catch(console.error);
