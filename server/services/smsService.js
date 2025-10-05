import twilio from 'twilio';
import { logger } from '../utils/logger.js';

class SMSService {
  constructor() {
    this.client = null;
    this.phoneNumber = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    if (this.isConfigured) return; // prevent re-initialization

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Twilio credentials missing in production');
      }
      logger.warn('Twilio credentials not found. SMS service will run in mock mode.');
      this.isConfigured = false;
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.phoneNumber = phoneNumber;
      this.isConfigured = true;
      logger.info('Twilio SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio SMS service:', error);
      this.isConfigured = false;
    }
  }

  async sendMessage(to, body, type = 'generic') {
    const formattedPhone = this.formatPhoneNumber(to);

    if (!this.isConfigured) {
      logger.info(`📱 Mock ${type} SMS to ${formattedPhone}: ${body}`);
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        mock: true
      };
    }

    try {
      const message = await this.client.messages.create({
        body,
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
      logger.error(`Failed to send ${type} SMS to ${formattedPhone}:`, error);
      logger.info(`📱 Fallback Mock ${type} SMS to ${formattedPhone}: ${body}`);
      return {
        success: true,
        messageId: `fallback-${Date.now()}`,
        mock: true,
        error: error.message
      };
    }
  }

  async sendOTP(phoneNumber, otp) {
    const body = `Your Milkat Post OTP is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendMessage(phoneNumber, body, 'OTP');
  }

  async sendInvitationSMS(phoneNumber, societyName, inviterName) {
    const body = `${inviterName} invited you to join ${societyName} on Milkat Post. Download the app and register with this number to accept the invitation.`;
    return this.sendMessage(phoneNumber, body, 'Invitation');
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters and leading zeros
    let cleaned = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');

    // If it's a 10-digit number (Indian format), add +91
    if (cleaned.length === 10) cleaned = '+91' + cleaned;
    // If it's 12 digits and starts with 91, add +
    else if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = '+' + cleaned;
    // If it doesn't start with +, add it
    else if (!phoneNumber.startsWith('+')) cleaned = '+' + cleaned;

    return cleaned;
  }

  isServiceConfigured() {
    return this.isConfigured;
  }

  getServiceStatus() {
    return {
      configured: this.isConfigured,
      phoneNumber: this.phoneNumber || 'Not configured',
      service: 'Twilio SMS'
    };
  }
}

// Singleton instance
const smsService = new SMSService();
export default smsService;
