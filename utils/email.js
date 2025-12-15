const nodemailer = require('nodemailer');

// Create transporter with better configuration
const createTransporter = async () => {
  // Check if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';
  
  
  if (isProduction) {
    // Production configuration - use Gmail or other SMTP service
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail', 'outlook', etc.
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
      },
    });
  } else {
    // Development configuration - use Ethereal Email
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.log('Ethereal Email setup failed, using simulation mode');
      return null; // Will trigger simulation mode
    }
  }
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await createTransporter();
    
    // If no transporter (development fallback) or in development mode, simulate email
    if (!transporter || process.env.NODE_ENV !== 'production') {
      console.log('🔧 Development mode: Simulating email send');
      console.log('📧 To:', to);
      console.log('📋 Subject:', subject);
      console.log('📄 Content:', text || html);
      
      // Extract OTP from email content for testing
      const otpMatch = (text || html).match(/\b\d{6}\b/);
      if (otpMatch) {
        console.log('🔐 === TEST OTP FOR EMAIL:', to, '=== OTP:', otpMatch[0], '===');
      }
      
      // Also log a fake OTP as backup
      const fakeOtp = Math.floor(100000 + Math.random() * 900000).toString()
      
      return { messageId: 'simulated-email-id', otp: otpMatch ? otpMatch[0] : fakeOtp };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"School Management System" <noreply@schoolsystem.com>',
      to,
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    if(!result){
      console.log('Email sending failed');
    }
    console.log('✅ Email sent successfully:', result.messageId);
    
    // Log the preview URL for Ethereal Email in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(result));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // For development, simulate email sending if real email fails
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Development mode: Simulating email send (fallback)');
      console.log('📧 To:', to);
      console.log('📋 Subject:', subject);
      console.log('📄 Content:', text || html);
      
      // Extract OTP from email content for testing
      const otpMatch = (text || html).match(/\b\d{6}\b/);
      if (otpMatch) {
        console.log('🔐 === TEST OTP FOR EMAIL:', to, '=== OTP:', otpMatch[0], '===');
      }
      
      // Also log a fake OTP as backup
      const fakeOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('🔐 === BACKUP TEST OTP FOR EMAIL:', to, '=== OTP:', fakeOtp, '===');
      
      return { messageId: 'simulated-email-id', otp: otpMatch ? otpMatch[0] : fakeOtp };
    }
    
    throw error;
  }
};

// Send email with attachment
const sendEmailWithAttachment = async ({ to, subject, text, html, buffer, filename }) => {
  try {
    const transporter = await createTransporter();
    
    // If no transporter (development fallback) or in development mode, simulate email
    if (!transporter || process.env.NODE_ENV !== 'production') {
      console.log('🔧 Development mode: Simulating email with attachment');
      console.log('📧 To:', to);
      console.log('📋 Subject:', subject);
      console.log('📎 Attachment:', filename);
      
      return { messageId: 'simulated-email-with-attachment-id' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"School Management System" <noreply@schoolsystem.com>',
      to,
      subject,
      text,
      html,
      attachments: [{
        filename,
        content: buffer,
      }],
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email with attachment sent successfully:', result.messageId);
    
    // Log the preview URL for Ethereal Email in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(result));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Email with attachment sending failed:', error);
    throw error;
  }
};

// Send bulk emails
const sendBulkEmail = async (recipients, subject, text, html) => {
  try {
    const transporter = await createTransporter();
    
    // If no transporter (development fallback) or in development mode, simulate email
    if (!transporter || process.env.NODE_ENV !== 'production') {
      console.log('🔧 Development mode: Simulating bulk email');
      console.log('📧 Recipients:', recipients.length, 'emails');
      console.log('📋 Subject:', subject);
      
      return { messageId: 'simulated-bulk-email-id' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"School Management System" <noreply@schoolsystem.com>',
      bcc: recipients, // Use BCC for bulk emails
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Bulk email sent successfully:', result.messageId);
    
    return result;
  } catch (error) {
    console.error('❌ Bulk email sending failed:', error);
    throw error;
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log('🔧 Development mode: No real email configuration needed');
      return true;
    }
    
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

module.exports = { 
  sendEmail, 
  sendEmailWithAttachment, 
  sendBulkEmail, 
  verifyEmailConfig 
};
