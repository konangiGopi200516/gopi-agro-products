async function run() {
  const oobCode = "dummy_oob_code";
  const newPassword = "password123";
  const API_KEY = "AIzaSyDE76TNNjVB_SM3jbpUS4ZwV1rzIZxRVVA"; // Extracted from auth.ts
  
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oobCode, newPassword })
  });
  
  const data = await response.json();
  console.log("Response:", data);
}

run().catch(console.error);
