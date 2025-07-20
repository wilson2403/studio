
'use server';

/**
 * @fileOverview A flow for sending bulk emails to all users.
 * - sendEmailToAllUsers - Sends an email with a given subject and body to all registered users.
 * - EmailInput - The input type for the sendEmailToAllUsers function.
 */

import { ai } from '@/ai/genkit';
import { getAllUsers } from '@/lib/firebase/firestore';
import { z } from 'zod';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn(
    'RESEND_API_KEY environment variable not set. Email functionality will not work.'
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

const EmailInputSchema = z.object({
  subject: z.string().describe('The subject of the email.'),
  body: z
    .string()
    .describe('The HTML content of the email body.'),
});
export type EmailInput = z.infer<typeof EmailInputSchema>;

const EmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type EmailOutput = z.infer<typeof EmailOutputSchema>;

const emailTemplate = (body: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
      .header { text-align: center; margin-bottom: 20px; }
      .header img { max-width: 100px; }
      .content { margin-top: 20px; }
      .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://firebasestorage.googleapis.com/v0/b/el-arte-de-sanar-dev.appspot.com/o/images%2F1722035985834-logo.png?alt=media&token=8e9b6a1e-8e4f-4a4a-9e1e-2e6b2e3e5e6d" alt="El Arte de Sanar Logo">
      </div>
      <div class="content">
        ${body}
      </div>
      <div class="footer">
        <p>El Arte de Sanar &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
  </html>
`;

export const sendEmailToAllUsers = ai.defineFlow(
  {
    name: 'sendEmailToAllUsersFlow',
    inputSchema: EmailInputSchema,
    outputSchema: EmailOutputSchema,
  },
  async ({ subject, body }) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is not configured.');
    }

    try {
      const users = await getAllUsers();
      const userEmails = users.map((user) => user.email).filter(Boolean);

      if (userEmails.length === 0) {
        return { success: false, message: 'No users found to send email to.' };
      }
      
      const htmlBody = emailTemplate(body);

      const { data, error } = await resend.emails.send({
        from: 'El Arte de Sanar <info@elartedesanarcr.com>',
        to: 'wilson2403@gmail.com', // Replace with your "from" email if your domain is verified
        bcc: userEmails,
        subject: subject,
        html: htmlBody,
      });

      if (error) {
        console.error('Resend API Error:', error);
        throw new Error(`Failed to send emails: ${error.message}`);
      }
      
      console.log('Emails sent successfully:', data);
      return { success: true, message: `Successfully sent email to ${userEmails.length} users.` };

    } catch (error: any) {
      console.error('Flow Error:', error);
      throw new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
);
