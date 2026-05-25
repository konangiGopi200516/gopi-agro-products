import { admin, db } from "./src/firebase";
import bcrypt from "bcryptjs";

async function testFirebase() {
  console.log("Firebase loaded");
}

testFirebase().catch(console.error);
