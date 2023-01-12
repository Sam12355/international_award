import nodemailer from 'nodemailer';
import { config } from '../config';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: config.smtp.user
    ? { user: config.smtp.user, pass: config.smtp.pass }
    : undefined,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Failed to send email', { to: options.to, error });
    // Don't throw — email failures shouldn't block business logic
  }
}

export async function sendArticleSubmitted(
  email: string,
  data: { reference: string; title: string; articleId: number },
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Article Submitted: ${data.reference}`,
    html: `
      <h2>Article Submitted Successfully</h2>
      <p>Your article has been submitted and is awaiting review.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px;font-weight:bold">Reference:</td><td style="padding:4px 12px">${data.reference}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:bold">Title:</td><td style="padding:4px 12px">${data.title}</td></tr>
      </table>
      <p>You can track the status of your article in <a href="${config.clientUrl}/articles/${data.articleId}">your dashboard</a>.</p>
      <p>Thank you for your submission!</p>
      <hr>
      <p style="color:#888;font-size:12px">Scientific Journal Platform</p>
    `,
  });
}

export async function sendArticleStatusChanged(
  email: string,
  data: {
    reference: string;
    title: string;
    previousStatus: string;
    newStatus: string;
    reviewerNotes?: string | null;
    articleId: number;
  },
): Promise<void> {
  const notesHtml = data.reviewerNotes
    ? `<tr><td style="padding:4px 12px;font-weight:bold">Reviewer Notes:</td><td style="padding:4px 12px">${data.reviewerNotes}</td></tr>`
    : '';

  await sendEmail({
    to: email,
    subject: `Article Status Updated: ${data.reference}`,
    html: `
      <h2>Article Status Updated</h2>
      <p>The status of your article has been changed.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px;font-weight:bold">Reference:</td><td style="padding:4px 12px">${data.reference}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:bold">Title:</td><td style="padding:4px 12px">${data.title}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:bold">Previous Status:</td><td style="padding:4px 12px">${data.previousStatus}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:bold">New Status:</td><td style="padding:4px 12px">${data.newStatus}</td></tr>
        ${notesHtml}
      </table>
      <p>View your article: <a href="${config.clientUrl}/articles/${data.articleId}">Click here</a></p>
      <hr>
      <p style="color:#888;font-size:12px">Scientific Journal Platform</p>
    `,
  });
}
