"use server";

import { sendEmail } from "@/ai/flows/send-email-flow";

export async function sendResetLink(email: string) {
  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    body: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password.</p>
        <p><a href="/reset-password?email=${email}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
