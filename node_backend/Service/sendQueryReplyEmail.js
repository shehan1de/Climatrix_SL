// Service/sendQueryReplyEmail.js
const nodemailer = require("nodemailer");
const path = require("path");

// ✅ create once (reuse connection)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password recommended
  },
});

const sendQueryReplyEmail = async ({
  to,
  name = "User",
  subject,
  queryId,
  userMessage,
  replyMessage,
}) => {
  const logoPath = path.join(__dirname, "../image/logo.png");

  const mailOptions = {
    from: `"Climatrix SL Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject || `Climatrix SL Support Reply - ${queryId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width:650px; margin:auto; padding:20px; border-radius:10px; border:1px solid #ddd; background:#f9f9f9;">
        <div style="text-align:center; margin-bottom:18px;">
          <img src="cid:climatrixlogo" alt="Climatrix SL Logo" style="width:120px; height:auto;">
        </div>

        <h2 style="text-align:center; color:#2b6cb0; margin:0;">Support Reply</h2>
        <p style="text-align:center; color:#555; margin-top:6px;">
          Reference ID: <b>${queryId}</b>
        </p>

        <div style="margin-top:18px; background:#fff; border:1px solid #eee; padding:16px; border-radius:8px;">
          <p style="margin:0 0 10px 0;">Hello ${name},</p>

          <p style="margin:0 0 10px 0; color:#222; line-height:1.6;">
            We received your query and here is our reply.
          </p>

          <div style="margin-top:10px; padding:12px; border-radius:8px; background:#f7fafc; border:1px solid #e2e8f0;">
            <div style="font-size:12px; color:#4a5568; margin-bottom:6px;"><b>Your Message</b></div>
            <div style="color:#2d3748; line-height:1.6;">${String(userMessage || "").replace(/\n/g, "<br/>")}</div>
          </div>

          <div style="margin-top:12px; padding:12px; border-radius:8px; background:#ebf8ff; border:1px solid #bee3f8;">
            <div style="font-size:12px; color:#2c5282; margin-bottom:6px;"><b>Our Reply</b></div>
            <div style="color:#1a202c; line-height:1.6;">${String(replyMessage || "").replace(/\n/g, "<br/>")}</div>
          </div>

          <p style="margin-top:14px; font-size:12px; color:#666;">
            If you need more help, reply to this email or submit a new query.
          </p>
        </div>

        <hr style="margin:20px 0;">
        <p style="font-size:12px; color:#888; text-align:center;">
          Climatrix SL Support • Automated email
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

module.exports = sendQueryReplyEmail;