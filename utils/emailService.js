const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });
};

// Email template for query reply with advanced styling and SVG icons
const getReplyEmailTemplate = (userName, userEmail, originalSubject, originalMessage, replyMessage, adminName) => {
  const logoUrl = process.env.LOGO_URL || 'https://via.placeholder.com/150x50/10b981/ffffff?text=Care+Foundation';
  const currentYear = new Date().getFullYear();
  
  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const safeUserName = escapeHtml(userName);
  const safeSubject = escapeHtml(originalSubject || 'No Subject');
  const safeOriginalMessage = escapeHtml(originalMessage || 'No message').replace(/\n/g, '<br>');
  const safeReplyMessage = escapeHtml(replyMessage).replace(/\n/g, '<br>');
  const safeAdminName = escapeHtml(adminName || 'Care Foundation Trust Team');
  
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>Reply from Care Foundation Trust®</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
        }
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .email-content {
                padding: 20px !important;
            }
            .header-title {
                font-size: 24px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Background Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center" style="padding: 0;">
                <!-- Main Container -->
                <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06); max-width: 600px; margin: 0 auto;">
                    
                    <!-- Header with Gradient Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 0; position: relative; overflow: hidden;">
                            <!-- Decorative Pattern -->
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4='); background-size: 40px 40px;"></div>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 40px 30px 30px;">
                                        <!-- Logo Container with SVG Heart Icon -->
                                        <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);">
                                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#10b981" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                        
                                        <!-- Organization Name -->
                                        <h1 class="header-title" style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                            Care Foundation Trust®
                                        </h1>
                                        
                                        <!-- Established Date -->
                                        <div style="margin-top: 12px; display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 20px; backdrop-filter: blur(10px);">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.92 0-2.03-1.64-2.73-3.65-3.24z" fill="#ffffff" opacity="0.9"/>
                                            </svg>
                                            <span style="color: #ffffff; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">Est. Since 1997</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Wave Decoration -->
                            <div style="height: 20px; background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1)); position: relative; overflow: hidden;">
                                <svg width="100%" height="20" viewBox="0 0 600 20" preserveAspectRatio="none" style="display: block;">
                                    <path d="M0,20 Q150,0 300,10 T600,10 L600,20 Z" fill="#ffffff" opacity="0.1"/>
                                </svg>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td class="email-content" style="padding: 50px 40px;">
                            <!-- Greeting -->
                            <div style="margin-bottom: 30px;">
                                <h2 style="color: #1f2937; margin: 0 0 12px 0; font-size: 28px; font-weight: 600; line-height: 1.3;">
                                    Dear ${safeUserName},
                                </h2>
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.7; margin: 0;">
                                    Thank you for contacting <strong style="color: #10b981;">Care Foundation Trust®</strong>. We have received your query and are pleased to provide you with the following response:
                                </p>
                            </div>
                            
                            <!-- Original Query Card -->
                            <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left: 5px solid #10b981; padding: 28px; margin: 30px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); position: relative; overflow: hidden;">
                                <!-- Decorative Corner -->
                                <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(16, 185, 129, 0.05); border-radius: 50%;"></div>
                                
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
                                    <div style="background: #10b981; padding: 10px; border-radius: 10px; display: inline-flex;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#ffffff"/>
                                        </svg>
                                    </div>
                                    <h3 style="color: #1f2937; margin: 0; font-size: 20px; font-weight: 600;">Your Original Query</h3>
                                </div>
                                
                                <div style="background: #ffffff; padding: 18px; border-radius: 8px; margin-top: 16px;">
                                    <p style="color: #4b5563; margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;">
                                        <strong style="color: #1f2937; display: inline-flex; align-items: center; gap: 6px;">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#10b981"/>
                                            </svg>
                                            Subject:
                                        </strong>
                                        <span style="color: #6b7280; margin-left: 8px;">${safeSubject}</span>
                                    </p>
                                    <div style="color: #374151; font-size: 15px; line-height: 1.8; white-space: pre-wrap; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                                        ${safeOriginalMessage}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Reply Card -->
                            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 5px solid #10b981; padding: 28px; margin: 30px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); position: relative; overflow: hidden;">
                                <!-- Animated Background Pattern -->
                                <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);"></div>
                                
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 12px; border-radius: 12px; display: inline-flex; box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V6h12v2z" fill="#ffffff"/>
                                        </svg>
                                    </div>
                                    <h3 style="color: #065f46; margin: 0; font-size: 20px; font-weight: 600;">Our Response</h3>
                                </div>
                                
                                <div style="background: #ffffff; padding: 22px; border-radius: 10px; margin-top: 16px; position: relative; z-index: 1; border: 1px solid rgba(16, 185, 129, 0.2);">
                                    <div style="color: #065f46; font-size: 16px; line-height: 1.8; white-space: pre-wrap; font-weight: 500;">
                                        ${safeReplyMessage}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Closing Message -->
                            <div style="margin: 40px 0 30px; padding: 24px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border-left: 4px solid #f59e0b;">
                                <div style="display: flex; align-items: start; gap: 12px;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0; margin-top: 2px;">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#f59e0b"/>
                                    </svg>
                                    <p style="color: #92400e; font-size: 15px; line-height: 1.7; margin: 0;">
                                        If you have any further questions or need additional assistance, please don't hesitate to reach out to us. We're here to help!
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Signature -->
                            <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 8px 0;">
                                    Best regards,
                                </p>
                                <p style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 4px 0;">
                                    ${safeAdminName}
                                </p>
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                    Care Foundation Trust®
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 30px; text-align: center;">
                            <!-- Contact Information -->
                            <div style="margin-bottom: 30px;">
                                <h4 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 20px 0; letter-spacing: 0.5px;">
                                    Contact Us
                                </h4>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 400px; margin: 0 auto;">
                                    <tr>
                                        <td align="center" style="padding: 12px 0;">
                                            <a href="mailto:carefoundationtrustorg@gmail.com" style="display: inline-flex; align-items: center; gap: 10px; color: #10b981; text-decoration: none; font-size: 15px; font-weight: 500; transition: color 0.3s;">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#10b981"/>
                                                </svg>
                                                <span>carefoundationtrustorg@gmail.com</span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding: 12px 0;">
                                            <a href="tel:+919136521052" style="display: inline-flex; align-items: center; gap: 10px; color: #10b981; text-decoration: none; font-size: 15px; font-weight: 500;">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#10b981"/>
                                                </svg>
                                                <span>+91 9136521052</span>
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Address -->
                            <div style="margin-bottom: 25px; padding-top: 25px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                                <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#9ca3af"/>
                                    </svg>
                                    1106, Alexander Tower, Sai World Empire<br>
                                    Navi Mumbai - 410210, India
                                </p>
                            </div>
                            
                            <!-- Copyright -->
                            <div style="padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                                <p style="color: #6b7280; font-size: 12px; margin: 0; letter-spacing: 0.5px;">
                                    © ${currentYear} Care Foundation Trust®. All rights reserved.
                                </p>
                                <p style="color: #4b5563; font-size: 11px; margin: 8px 0 0 0;">
                                    Registered Non-Profit Organization | Est. 1997
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
  `;
};

// Send reply email
exports.sendReplyEmail = async (toEmail, userName, originalSubject, originalMessage, replyMessage, adminName) => {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('SMTP not configured. Email sending skipped.');
      return { success: false, message: 'SMTP not configured' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Care Foundation Trust" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Re: ${originalSubject || 'Your Query'} - Care Foundation Trust`,
      html: getReplyEmailTemplate(userName, toEmail, originalSubject, originalMessage, replyMessage, adminName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email template for pending account notification
const getPendingAccountEmailTemplate = (userName) => {
  const currentYear = new Date().getFullYear();
  
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const safeUserName = escapeHtml(userName);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Pending Approval - Care Foundation Trust</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; color: #ffffff; }
        .content { padding: 40px 30px; }
        .footer { background: #1f2937; padding: 30px; text-align: center; color: #9ca3af; font-size: 12px; }
        .contact-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Care Foundation Trust®</h1>
        </div>
        <div class="content">
            <h2 style="color: #1f2937;">Dear ${safeUserName},</h2>
            <p style="color: #4b5563; line-height: 1.7;">
                Thank you for registering with our platform.
            </p>
            <p style="color: #4b5563; line-height: 1.7;">
                We would like to inform you that your account request has been successfully received and is currently <strong style="color: #10b981;">pending for admin approval</strong>. Our team is reviewing your details, and this process usually takes a short time.
            </p>
            <p style="color: #4b5563; line-height: 1.7;">
                You will receive another email as soon as your account is approved by the admin.
            </p>
            <div class="contact-info">
                <p style="margin: 0; color: #1f2937; font-weight: 600;">If you have any questions or need assistance, please feel free to contact us at <strong style="color: #10b981;">+91 9136521052</strong>.</p>
            </div>
            <p style="color: #4b5563; line-height: 1.7;">
                Thank you for your patience and understanding.
            </p>
            <p style="color: #4b5563; line-height: 1.7; margin-top: 30px;">
                Best regards,<br>
                <strong style="color: #10b981;">carefoundationtrust.org</strong>
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© ${currentYear} Care Foundation Trust®. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Email template for account approval notification
const getApprovedAccountEmailTemplate = (userName) => {
  const currentYear = new Date().getFullYear();
  
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const safeUserName = escapeHtml(userName);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Approved - Care Foundation Trust</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; color: #ffffff; }
        .content { padding: 40px 30px; }
        .footer { background: #1f2937; padding: 30px; text-align: center; color: #9ca3af; font-size: 12px; }
        .contact-info { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .success-badge { background: #10b981; color: #ffffff; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Care Foundation Trust®</h1>
        </div>
        <div class="content">
            <h2 style="color: #1f2937;">Dear ${safeUserName},</h2>
            <div style="text-align: center;">
                <div class="success-badge">✓ Account Approved</div>
            </div>
            <p style="color: #4b5563; line-height: 1.7;">
                We are happy to inform you that your account has been <strong style="color: #10b981;">successfully approved by the admin</strong>.
            </p>
            <p style="color: #4b5563; line-height: 1.7;">
                You can now log in and start using all the features of our platform without any restrictions.
            </p>
            <div class="contact-info">
                <p style="margin: 0; color: #1f2937; font-weight: 600;">If you need any help or have questions, feel free to reach out to us at <strong style="color: #10b981;">+91 9136521052</strong>.</p>
            </div>
            <p style="color: #4b5563; line-height: 1.7; margin-top: 30px;">
                Welcome to care foundation trust, and we wish you a great experience with us!
            </p>
            <p style="color: #4b5563; line-height: 1.7; margin-top: 30px;">
                Best regards,<br>
                <strong style="color: #10b981;">carefoundationtrust.org</strong>
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© ${currentYear} Care Foundation Trust®. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Send pending account email
exports.sendPendingAccountEmail = async (toEmail, userName) => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('SMTP not configured. Email sending skipped.');
      return { success: false, message: 'SMTP not configured' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Care Foundation Trust" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Account Pending Approval - Care Foundation Trust',
      html: getPendingAccountEmailTemplate(userName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Pending account email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending pending account email:', error);
    return { success: false, error: error.message };
  }
};

// Send approved account email
exports.sendApprovedAccountEmail = async (toEmail, userName) => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      console.log('SMTP not configured. Email sending skipped.');
      return { success: false, message: 'SMTP not configured' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Care Foundation Trust" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Account Approved - Care Foundation Trust',
      html: getApprovedAccountEmailTemplate(userName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approved account email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approved account email:', error);
    return { success: false, error: error.message };
  }
};

// Test email connection
exports.testEmailConnection = async () => {
  try {
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
      return { success: false, message: 'SMTP credentials not configured' };
    }

    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email server connection successful' };
  } catch (error) {
    console.error('Email connection test failed:', error);
    return { success: false, error: error.message };
  }
};

