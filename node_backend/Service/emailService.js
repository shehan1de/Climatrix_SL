const nodemailer = require("nodemailer");
const path = require("path");

const sendOtpEmail = async (to, otp, name = "User") => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const logoPath = path.join(__dirname, "../image/logo.png");

    const mailOptions = {
      from: `"Climatrix SL Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🌿 Climatrix SL - Your Verification Code",
      html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border-radius:10px; border:1px solid #ddd; background:#f9f9f9;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="cid:climatrixlogo" alt="Climatrix SL Logo" style="width:120px; height:auto;">
        </div>
        <h2 style="text-align:center; color:#2F855A;">Your Verification Code</h2>
        <p>Hello ${name},</p>
        <p>You requested a verification code for your Climatrix SL account. Use the code below to proceed:</p>
     <div style=" text-align:center; font-size:24px; font-weight:bold; background:#2F855A; color:#fff; padding:15px; border-radius:5px; display:block;  width: fit-content; margin: 20px auto; "> 
    ${otp}
</div>

        <p style="margin-top:20px;">This code is valid for 10 minutes. Keep it confidential.</p>
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

    await transporter.sendMail(mailOptions);
    console.log("Climatrix SL OTP email sent to:", to);
  } catch (err) {
    console.error("Error sending OTP email:", err);
  }
};

module.exports = sendOtpEmail;
