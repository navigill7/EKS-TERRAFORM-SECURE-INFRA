import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email, otp, firstName) => {
  const mailOptions = {
    from: {
      name: 'UniLink',
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: 'Verify Your Email - UniLink',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 UniLink</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName || 'there'}! 👋</h2>
              <p>Thank you for signing up with UniLink. Please verify your email address.</p>
              <div class="otp-box">
                <p style="margin: 0; color: #6c757d;">Your verification code is:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">Valid for 10 minutes</p>
              </div>
              <p><strong>⚠️ Security Note:</strong> Never share this code with anyone.</p>
            </div>
            <div class="footer">
              <p>© 2025 UniLink. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ OTP sent to ${email}`);
};