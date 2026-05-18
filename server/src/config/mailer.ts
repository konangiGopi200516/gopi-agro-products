import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables

let transporter: nodemailer.Transporter;

const initMailer = async () => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (user && pass && !user.includes("dummy")) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // upgrades to TLS via STARTTLS
      auth: { user, pass },
    });
    console.log(`🔥 Nodemailer initialized with real Gmail SMTP (${user})`);
  } else {
    console.log("⚡ Initializing Nodemailer Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`🔥 Nodemailer Ethereal test SMTP initialized (${testAccount.user})`);
  }
};

initMailer().catch(console.error);

export const sendMail = async (to: string, subject: string, html: string) => {
  if (!transporter) {
    await initMailer();
  }
  try {
    const info = await transporter.sendMail({
      from: `"KisanMart 🌾" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent successfully to ${to}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n✉️ =================================================`);
      console.log(`✉️ EMAIL PREVIEW URL: ${previewUrl}`);
      console.log(`✉️ =================================================\n`);
    }
    return { success: true, previewUrl: previewUrl || undefined, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw error;
  }
};
