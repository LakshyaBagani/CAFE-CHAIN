"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mailOption;
function mailOption(email, verificationCode) {
    return {
        from: `"Sojo's Cafe" <${process.env.SENDER_EMAIL}>`,
        to: email,
        subject: "🔐 Your OTP Code - Verify Your Email",
        html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fc; padding: 40px 0;">
      <div style="max-width: 500px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5, #3b82f6); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Email Verification</h1>
          <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Secure your account with the OTP below</p>
        </div>
        
        <!-- OTP Section -->
        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
            Hello,  
            Use the following One-Time Password to complete your verification:
          </p>
          <div style="display: inline-block; background: #f3f4f6; padding: 15px 25px; border-radius: 8px; border: 1px dashed #3b82f6;">
            <span style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #1e3a8a;">${verificationCode}</span>
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          If you didn’t request this, you can safely ignore this email.  
          <br><br>
          © ${new Date().getFullYear()} Sojo Cafe. All rights reserved.
        </div>
      </div>
    </div>
    `,
    };
}
