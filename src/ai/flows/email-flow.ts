'use server';

/**
 * @fileOverview A flow for sending bulk emails to all users.
 * - sendEmailToAllUsers - Sends an email with a given subject and body to all registered users.
 * - EmailInput - The input type for the sendEmailToAllUsers function.
 */

import { ai } from '@/ai/genkit';
import { getAllUsers, logError } from '@/lib/firebase/firestore';
import { z } from 'zod';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn(
    'RESEND_API_KEY environment variable not set. Email functionality will not work.'
  );
}

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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="h-10 w-10" fill="currentColor"><path d="M66.3,36.9a2,2,0,0,0-2.8,0l-15.1,15a2,2,0,0,1-2.8,0L30.5,36.9a2,2,0,0,0-2.8,2.8l15.1,15a2,2,0,0,0,2.8,0l15.1-15A2,2,0,0,0,66.3,36.9Z"/><path d="M83.9,46.1a2,2,0,0,0-2.8,0L66,61.3a2,2,0,0,1-2.8,0L48,46.1a2,2,0,0,0-2.8,2.8L60.4,64.1a2,2,0,0,0,2.8,0L78.3,48.9a2,2,0,0,0,5.6-2.8Z"/><path d="M50,8.1a2,2,0,0,0-2,2V25.3a2,2,0,0,0,4,0V10.1A2,2,0,0,0,50,8.1Z"/><path d="M50,66.3a2,2,0,0,0-2,2V83.5a2,2,0,0,0,4,0V68.3A2,2,0,0,0,50,66.3Z"/><path d="M69.5,23.3a2,2,0,0,0-2.8-1.5L51.6,30.4a2,2,0,1,0,2,3.5l15.1-8.7A2,2,0,0,0,69.5,23.3Z"/><path d="M33.2,74.9a2,2,0,0,0-2.8-1.5L15.3,64.7a2,2,0,1,0,2,3.5l15.1-8.7A2,2,0,0,0,33.2,74.9Z"/><path d="M30.5,23.3a2,2,0,0,0,.8-3.9L46.4,10.8a2,2,0,1,0-2-3.5L29.3,19.8a2,2,0,0,0,.8,3.9h0Z"/><path d="M70.7,80.2a2,2,0,0,0,.8-3.9L56.4,67.6a2,2,0,1,0-2,3.5L70,82.7a2,2,0,0,0,.7.1h0A2,2,0,0,0,70.7,80.2Z"/><path d="M84.7,30.4a2,2,0,0,0-1.5,2.8l8.7,15.1a2,2,0,0,0,3.5-2L86.2,31.2A2,2,0,0,0,84.7,30.4Z"/><path d="M5.3,69.6a2,2,0,0,0-1.5,2.8l8.7,15.1a2,2,0,1,0,3.5-2L7.3,71.7a2,2,0,0,0-2-2.1Z"/><path d="M15.3,31.2a2,2,0,0,0-2-1.5,2,2,0,0,0-1.5,2.8l8.7,15.1a2,2,0,1,0,3.5-2Z"/><path d="M74.7,86.2a2,2,0,0,0-2-1.5,2,2,0,0,0-1.5,2.8l8.7,15.1a2,2,0,1,0,3.5-2Z"/><path d="M50,91.9A41.9,41.9,0,1,1,91.9,50,42,42,0,0,1,50,91.9ZM50,12.1A37.9,37.9,0,1,0,87.9,50,38,38,0,0,0,50,12.1Z"/></svg>
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
    
    const resend = new Resend(process.env.RESEND_API_KEY);

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
        await logError(error, { function: 'sendEmailToAllUsers - Resend' });
        throw new Error(`Failed to send emails: ${error.message}`);
      }
      
      console.log('Emails sent successfully:', data);
      return { success: true, message: `Successfully sent email to ${userEmails.length} users.` };

    } catch (error: any) {
      console.error('Flow Error:', error);
      await logError(error, { function: 'sendEmailToAllUsers - Flow' });
      throw new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
);
