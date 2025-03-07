const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendOTPByEmail = (email, otp) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your OTP Code</title>
        <style>
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            text-align: center;
            padding: 20px;
            background-color: #4a90e2;
            color: white;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .otp-box {
            background-color: #f5f5f5;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            text-align: center;
            font-size: 24px;
            letter-spacing: 5px;
            font-weight: bold;
            color: #333;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
          .warning {
            color: #e74c3c;
            font-size: 13px;
            margin-top: 15px;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
              padding: 10px;
            }
            .content {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>One-Time Password</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have requested to change your password. Please use the following OTP to complete the process:</p>
            
            <div class="otp-box">
              ${otp}
            </div>
            
            <p>This OTP will expire in 10 minutes.</p>
            
            <div class="warning">
              ⚠ Never share this OTP with anyone. Our team will never ask for your OTP.
            </div>
          </div>
          <div class="footer">
            <p>If you didn't request this password change, please ignore this email or contact support.</p>
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Your Password Change OTP',
    html: htmlContent,
    text: "Your OTP for password change is ${otp}. This OTP will expire in 10 minutes. Never share this OTP with anyone.", // Plain text fallback
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendOTPByEmail;