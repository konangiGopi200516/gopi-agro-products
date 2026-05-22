import crypto from "crypto";
import { db } from "../firebase";

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function storeOTP(orderId: string, otp: string): Promise<void> {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  await db.ref(`otps/${orderId}`).set({ otp, expiresAt, used: false });
}

export async function verifyOTP(orderId: string, inputOtp: string): Promise<{ valid: boolean; reason?: string }> {
  const snapshot = await db.ref(`otps/${orderId}`).get();
  if (!snapshot.exists()) return { valid: false, reason: "OTP not found" };

  const { otp, expiresAt, used } = snapshot.val();
  if (used) return { valid: false, reason: "OTP already used" };
  if (Date.now() > expiresAt) return { valid: false, reason: "OTP expired" };
  if (otp !== inputOtp) return { valid: false, reason: "Invalid OTP" };

  await db.ref(`otps/${orderId}`).update({ used: true });
  return { valid: true };
}

export async function invalidateOTP(orderId: string): Promise<void> {
  await db.ref(`otps/${orderId}`).remove();
}
