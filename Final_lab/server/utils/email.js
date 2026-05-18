const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transport.
 * Configure via .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * Falls back to logging to console in development if SMTP is not configured.
 */
const createTransport = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  // No SMTP configured — use Ethereal test account (logs to console)
  return null;
};

/**
 * Send an email. If SMTP is not configured, logs the email to console.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransport();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Uni Buy & Sell" <noreply@unibuysell.com>',
    to,
    subject,
    html
  };

  if (transporter) {
    await transporter.sendMail(mailOptions);
  } else {
    // Dev fallback: log to console
    console.log('\n========== EMAIL (no SMTP configured) ==========');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log('=================================================\n');
  }
};

module.exports = { sendEmail };
