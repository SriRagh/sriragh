"use server";
/**
 * @fileOverview An email sending AI agent.
 *
 * - sendEmail - A function that handles sending an email.
 * - SendEmailInput - The input type for the sendEmail function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const SendEmailInputSchema = z.object({
  to: z.string().email().describe("The email address of the recipient."),
  subject: z.string().describe("The subject of the email."),
  body: z.string().describe("The HTML body of the email."),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export async function sendEmail(input: SendEmailInput): Promise<void> {
  await sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: "sendEmailFlow",
    inputSchema: SendEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    // In a real application, you would integrate with an email sending service
    // like SendGrid, Mailgun, or AWS SES here.
    // For this example, we will just log the email to the console.
    console.log("--- Sending Email ---");
    console.log(`To: ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log(`Body: \n${input.body}`);
    console.log("---------------------");

    // Simulate a short delay for sending the email.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
);
