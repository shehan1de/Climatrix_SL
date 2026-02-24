// services/sendAlertEmail.js
const nodemailer = require("nodemailer");
const path = require("path");

// ✅ create once (reuse connection)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Send ONE alert email to ONE user
const sendAlertEmail = async ({
  to,
  name = "User",
  subject,
  alertType = "Emergency Alert",
  message,
}) => {
  const logoPath = path.join(__dirname, "../image/logo.png");

  const mailOptions = {
    from: `"Climatrix SL Alerts" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject || `🚨 Climatrix SL Alert - ${alertType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width:650px; margin:auto; padding:20px; border-radius:10px; border:1px solid #ddd; background:#f9f9f9;">
        <div style="text-align:center; margin-bottom:18px;">
          <img src="cid:climatrixlogo" alt="Climatrix SL Logo" style="width:120px; height:auto;">
        </div>

        <h2 style="text-align:center; color:#c53030; margin:0;">${alertType}</h2>
        <p style="text-align:center; color:#555; margin-top:6px;">
          Official emergency notification from Climatrix SL
        </p>

        <div style="margin-top:18px; background:#fff; border:1px solid #eee; padding:16px; border-radius:8px;">
          <p style="margin:0 0 10px 0;">Hello ${name},</p>

          <p style="margin:0 0 10px 0; color:#222; line-height:1.6;">
            ${String(message || "").replace(/\n/g, "<br/>")}
          </p>

          <p style="margin-top:14px; font-size:12px; color:#666;">
            You received this alert because you enabled emergency email alerts in your Climatrix SL account.
          </p>
        </div>

        <hr style="margin:20px 0;">
        <p style="font-size:12px; color:#888; text-align:center;">
          This is an automated email from Climatrix SL. Please do not reply.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: "logo.png",
        path: logoPath,
        cid: "climatrixlogo",
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendAlertEmail;