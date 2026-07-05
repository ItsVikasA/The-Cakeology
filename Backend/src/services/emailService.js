import nodemailer from 'nodemailer';
import { Config } from '../config/config.js';
import settingsModel from '../models/settingsModel.js';

// Render's free tier blocks outbound SMTP (ports 25/465/587), so Gmail SMTP
// times out in production. When BREVO_API_KEY is set we send over Brevo's
// HTTPS API (port 443, allowed) instead. Locally, with no Brevo key, we fall
// back to Gmail SMTP via an app password.
const brevoConfigured = Boolean(process.env.BREVO_API_KEY);
const smtpConfigured = Boolean(Config.EMAIL_USER && Config.EMAIL_PASS);

let transporter = null;

if (!brevoConfigured && smtpConfigured) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: Config.EMAIL_USER,
            pass: Config.EMAIL_PASS,
        },
    });

    transporter.verify((error) => {
        if (error) console.error('Error connecting to email server:', error.message);
        else console.log('Email server is ready to send messages');
    });
} else if (brevoConfigured) {
    console.log('Email configured via Brevo HTTP API');
} else {
    console.warn('Email is not configured (no BREVO_API_KEY and no EMAIL_USER/EMAIL_PASS). Emails are disabled.');
}

// Resolve the admin-configured sender name, falling back to a default.
async function getSenderName() {
    try {
        const settings = await settingsModel.findOne({ key: 'global' }).select('email');
        if (settings?.email?.senderName) return settings.email.senderName;
    } catch { /* use default */ }
    return 'Cakeology';
}

// The verified "from" address. Brevo requires a verified sender; we reuse the
// Gmail/EMAIL_USER address (verify it as a single sender in the Brevo dashboard).
function getFromEmail() {
    return process.env.EMAIL_FROM || Config.EMAIL_USER || 'no-reply@cakeology.com';
}

async function sendViaBrevo(to, subject, html, senderName) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            sender: { name: senderName, email: getFromEmail() },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Brevo API responded ${res.status}: ${detail}`);
    }
}

const sendEmail = async (to, subject, html) => {
    if (!brevoConfigured && !transporter) {
        console.warn(`Email not sent to ${to}: email service is not configured.`);
        return;
    }

    try {
        const senderName = await getSenderName();

        if (brevoConfigured) {
            await sendViaBrevo(to, subject, html, senderName);
            console.log(`Email sent to ${to} via Brevo`);
            return;
        }

        const info = await transporter.sendMail({
            from: `"${senderName}" <${getFromEmail()}>`,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error.message);
    }
};

export default sendEmail;
