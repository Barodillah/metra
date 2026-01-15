import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

// Verify transporter
transporter.verify()
    .then(() => console.log('✅ Email transporter ready'))
    .catch(err => console.error('❌ Email transporter error:', err.message));

export const sendOtpEmail = async (email, otp, name = 'User') => {
    const mailOptions = {
        from: `"METRA" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject: '🔐 Kode Verifikasi METRA',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" style="max-width: 480px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                                <span style="font-size: 28px;">✨</span>
                            </div>
                            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">METRA</h1>
                            <p style="color: #64748B; font-size: 12px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">Spiritual Data Science</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="color: #94A3B8; font-size: 16px; margin: 0 0 24px; line-height: 1.6;">
                                Halo <strong style="color: #FFFFFF;">${name}</strong>,
                            </p>
                            <p style="color: #94A3B8; font-size: 16px; margin: 0 0 32px; line-height: 1.6;">
                                Gunakan kode berikut untuk memverifikasi akun METRA kamu:
                            </p>
                            
                            <!-- OTP Code -->
                            <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                                <div style="color: #FFFFFF; font-size: 36px; font-weight: 800; letter-spacing: 12px; font-family: 'Monaco', 'Consolas', monospace;">
                                    ${otp}
                                </div>
                            </div>
                            
                            <p style="color: #64748B; font-size: 14px; margin: 0; line-height: 1.6; text-align: center;">
                                ⏰ Kode ini berlaku selama <strong style="color: #06B6D4;">10 menit</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px;">
                            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
                                <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.6; text-align: center;">
                                    Jika kamu tidak meminta kode ini, abaikan email ini.
                                </p>
                                <p style="color: #334155; font-size: 11px; margin: 16px 0 0; text-align: center;">
                                    © 2026 METRA. All rights reserved.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    return transporter.sendMail(mailOptions);
};

export default transporter;
