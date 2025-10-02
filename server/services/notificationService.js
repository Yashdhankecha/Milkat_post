import nodemailer from 'nodemailer';
import User from '../models/User.js';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Send developer selection notification
export const sendDeveloperSelectionNotification = async ({
  developerId,
  projectId,
  projectTitle,
  proposalTitle,
  developerName,
  ownerName
}) => {
  try {
    // Get developer details
    const developer = await User.findById(developerId);
    if (!developer) {
      throw new Error('Developer not found');
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@nestlyestate.com',
      to: developer.email,
      subject: `🎉 Congratulations! Your Proposal Has Been Selected - ${projectTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your proposal has been selected</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Dear ${developerName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              We are pleased to inform you that your proposal for the redevelopment project has been <strong>selected</strong> by the society members!
            </p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #166534; margin-top: 0;">📋 Project Details</h3>
              <ul style="color: #166534; margin: 0; padding-left: 20px;">
                <li><strong>Project:</strong> ${projectTitle}</li>
                <li><strong>Your Proposal:</strong> ${proposalTitle}</li>
                <li><strong>Selected by:</strong> ${ownerName}</li>
                <li><strong>Selection Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">🚀 Next Steps</h3>
              <p style="color: #92400e; margin: 0; line-height: 1.6;">
                You will be contacted shortly by the society owner to discuss the next steps, including:
              </p>
              <ul style="color: #92400e; margin: 10px 0 0 0; padding-left: 20px;">
                <li>Legal documentation and contracts</li>
                <li>Project timeline and milestones</li>
                <li>Payment terms and schedules</li>
                <li>Construction planning and permits</li>
              </ul>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">📞 Contact Information</h3>
              <p style="color: #1e40af; margin: 0; line-height: 1.6;">
                If you have any questions or need to discuss the project details, please contact the society owner directly.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Thank you for your interest in this redevelopment project. We look forward to working with you!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>This is an automated notification from Nestly Estate Management System</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Developer selection notification sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      developerEmail: developer.email
    };
  } catch (error) {
    console.error('❌ Failed to send developer selection notification:', error);
    throw error;
  }
};

// Send rejection notification to other developers
export const sendDeveloperRejectionNotification = async ({
  developerId,
  projectId,
  projectTitle,
  proposalTitle,
  developerName,
  ownerName
}) => {
  try {
    const developer = await User.findById(developerId);
    if (!developer) {
      throw new Error('Developer not found');
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@nestlyestate.com',
      to: developer.email,
      subject: `Update on Your Proposal - ${projectTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f3f4f6; color: #374151; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Proposal Update</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your interest</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Dear ${developerName},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Thank you for submitting your proposal for the redevelopment project. After careful consideration, 
              the society has selected another developer for this project.
            </p>
            
            <div style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">📋 Project Details</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li><strong>Project:</strong> ${projectTitle}</li>
                <li><strong>Your Proposal:</strong> ${proposalTitle}</li>
                <li><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">💡 Future Opportunities</h3>
              <p style="color: #92400e; margin: 0; line-height: 1.6;">
                We appreciate your interest and encourage you to participate in future redevelopment opportunities. 
                Your proposal was valuable and we look forward to working with you on other projects.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Thank you for your participation in our redevelopment process.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>This is an automated notification from Nestly Estate Management System</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Developer rejection notification sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      developerEmail: developer.email
    };
  } catch (error) {
    console.error('❌ Failed to send developer rejection notification:', error);
    throw error;
  }
};
