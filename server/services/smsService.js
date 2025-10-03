import twilio from 'twilio';
import { logger } from '../utils/logger.js';

class SMSService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !phoneNumber) {
        logger.warn('Twilio credentials not found. SMS service will run in mock mode.');
        this.isConfigured = false;
        return;
      }

      this.client = twilio(accountSid, authToken);
      this.phoneNumber = phoneNumber;
      this.isConfigured = true;
      
      logger.info('Twilio SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio SMS service:', error);
      this.isConfigured = false;
    }
  }

  async sendOTP(phoneNumber, otp) {
    try {
      // Format phone number to E.164 format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.isConfigured) {
        // Mock SMS in development
        logger.info(`📱 Mock SMS to ${formattedPhone}: Your Milkat Post OTP is: ${otp}. Valid for 10 minutes.`);
        return {
          success: true,
          messageId: `mock-${Date.now()}`,
          mock: true
        };
      }

      const message = await this.client.messages.create({
        body: `Your Milkat Post OTP is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
        from: this.phoneNumber,
        to: formattedPhone
      });

      logger.info(`SMS sent successfully to ${formattedPhone}. Message SID: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid,
        mock: false
      };

    } catch (error) {
      logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      
      // Fallback to mock SMS in case of Twilio failure
      logger.info(`📱 Fallback Mock SMS to ${phoneNumber}: Your Milkat Post OTP is: ${otp}. Valid for 10 minutes.`);
      
      return {
        success: true,
        messageId: `fallback-${Date.now()}`,
        mock: true,
        error: error.message
      };
    }
  }

  async sendInvitationSMS(phoneNumber, societyName, inviterName) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.isConfigured) {
        logger.info(`📱 Mock Invitation SMS to ${formattedPhone}: ${inviterName} invited you to join ${societyName} on Milkat Post. Download the app and register with this number to accept.`);
        return {
          success: true,
          messageId: `mock-invitation-${Date.now()}`,
          mock: true
        };
      }

      const message = await this.client.messages.create({
        body: `${inviterName} invited you to join ${societyName} on Milkat Post. Download the app and register with this number to accept the invitation.`,
        from: this.phoneNumber,
        to: formattedPhone
      });

      logger.info(`Invitation SMS sent successfully to ${formattedPhone}. Message SID: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid,
        mock: false
      };

    } catch (error) {
      logger.error(`Failed to send invitation SMS to ${phoneNumber}:`, error);
      
      // Fallback to mock SMS
      logger.info(`📱 Fallback Mock Invitation SMS to ${phoneNumber}: ${inviterName} invited you to join ${societyName} on Milkat Post.`);
      
      return {
        success: true,
        messageId: `fallback-invitation-${Date.now()}`,
        mock: true,
        error: error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's a 10-digit number (Indian format), add +91
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    }
    // If it's 12 digits and starts with 91, add +
    else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    }
    // If it doesn't start with +, add it
    else if (!phoneNumber.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  // Method to check if service is properly configured
  isServiceConfigured() {
    return this.isConfigured;
  }

  // Method to get service status
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      phoneNumber: this.phoneNumber || 'Not configured',
      service: 'Twilio SMS'
    };
  }
}

// Create singleton instance
const smsService = new SMSService();

export default smsService;
