const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email (SMTP) not configured — OTP emails will not be sent. Set EMAIL_HOST/EMAIL_USER/EMAIL_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 465,
    secure: Number(EMAIL_PORT) === 465, // true for port 465, false for 587
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  return transporter;
}

/**
 * Sends the OTP verification email via Gmail SMTP (or any SMTP provider).
 * Returns true if an email was actually sent, false if SMTP isn't configured
 * (the caller should fall back to showing the OTP on-screen in that case).
 */
async function sendOtpEmail({ toEmail, toName, otp, expiryMinutes }) {
  const t = getTransporter();
  if (!t) return false;

  // DEV: log OTP to server console for local testing/debugging
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[DEV] sendOtpEmail -> OTP for ${toEmail}: ${otp} (valid ${expiryMinutes} minutes)`);
    } catch (e) {}
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await t.sendMail({
    from: `"E-PASS — BGI" <${from}>`,
    to: toEmail,
    subject: 'Your E-PASS verification OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #E5E8EE;border-radius:12px;">
        <a href="https://res.cloudinary.com/dnldcrhab/image/upload/f_auto,q_auto/18561_cxj7ez" target="_blank" rel="noopener noreferrer">
          <img src="https://res.cloudinary.com/dnldcrhab/image/upload/f_auto,q_auto/18561_cxj7ez" alt="Bansal Group of Institutes" style="max-width:180px;height:auto;display:block;margin:0 auto 16px;" />
        </a>
        <h2 style="color:#0A4DAD;margin-bottom:4px;">E-PASS</h2>
        <p style="color:#6B7280;margin-top:0;">Bansal Group of Institutes</p>
        <p>Hi ${toName || ''},</p>
        <p>Your One-Time Password (OTP) for E-PASS registration is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#0A4DAD;background:#F7F9FC;padding:16px;text-align:center;border-radius:10px;margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#6B7280;font-size:13px;">This OTP is valid for ${expiryMinutes} minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  return true;
}

module.exports = { sendOtpEmail };
