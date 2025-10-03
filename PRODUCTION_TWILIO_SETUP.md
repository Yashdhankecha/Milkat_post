# Production Twilio SMS Setup Guide

This guide provides step-by-step instructions for setting up Twilio SMS services for production use in your Nestly Estate application.

## Prerequisites for Production

- Twilio account (upgraded from trial)
- Valid payment method added to Twilio account
- Production server environment ready
- Domain/application ready for production deployment

## Step 1: Upgrade Your Twilio Account

### From Trial to Production:
1. **Log into Twilio Console**: https://console.twilio.com/
2. **Go to Billing**: Click on your account name → Billing
3. **Add Payment Method**: 
   - Click "Add a payment method"
   - Enter your credit card details
   - Set up billing alerts (recommended: $10, $50, $100)
4. **Verify Account**: Complete any required verification steps

### Account Verification:
- Provide business information
- Verify your identity
- Complete any compliance requirements for your region

## Step 2: Purchase a Production Phone Number

### Navigate to Phone Numbers:
1. **Go to Phone Numbers**: https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. **Click "Buy a number"**
3. **Select Requirements**:
   - **Country**: India (for Indian users) or your target country
   - **Capabilities**: Check "SMS" (required)
   - **Type**: Local number (recommended for better delivery rates)

### Choose Your Number:
- **Search available numbers**
- **Select a number** (costs ~$1-2/month + usage fees)
- **Purchase the number**
- **Note the phone number** (format: +91XXXXXXXXXX for India, +1XXXXXXXXXX for US)

### Important Notes:
- **Indian Numbers**: Better delivery rates for Indian users, lower cost (~₹0.50/SMS)
- **US Numbers**: Can send to international numbers, higher cost (~$0.05-0.15/SMS to India)
- **Toll-free Numbers**: May have different delivery characteristics
- **Recommendation**: Use Indian number for Indian users, US number for global reach

## Step 3: Get Your Twilio Credentials

### Account Credentials:
1. **Go to Console Dashboard**: https://console.twilio.com/us1/develop/console
2. **Find Account Info** (top of dashboard):
   - **Account SID**: Starts with "AC" (e.g., AC1234567890abcdef1234567890abcdef)
   - **Auth Token**: Click "Show" to reveal (e.g., 1234567890abcdef1234567890abcdef)

### Phone Number Details:
1. **Go to Phone Numbers**: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. **Click on your purchased number**
3. **Note the phone number** (e.g., +91XXXXXXXXXX)

## Step 4: Configure Production Environment

### Server Environment Variables:
Create or update your production `.env` file:

```env
# Production Environment
NODE_ENV=production

# Twilio Production Configuration
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=1234567890abcdef1234567890abcdef
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX

# Other Production Variables
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
PORT=5000
HOST=0.0.0.0
```

### Security Considerations:
- **Never commit `.env` files** to version control
- **Use different credentials** for each environment (dev/staging/production)
- **Rotate credentials** periodically
- **Use environment-specific configs** in your deployment platform

## Step 5: Update Your Application Code

### Verify SMS Service Configuration:
The SMS service is already configured to work in production. Key features:

```javascript
// server/services/smsService.js
class SMSService {
  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      // Falls back to mock SMS in development
      this.isConfigured = false;
      return;
    }

    // Production: Real Twilio SMS
    this.client = twilio(accountSid, authToken);
    this.phoneNumber = phoneNumber;
    this.isConfigured = true;
  }
}
```

### Production Behavior:
- **Real SMS sent** via Twilio
- **Proper error handling** for delivery failures
- **Logging** for monitoring and debugging
- **Rate limiting** considerations

## Step 6: Test Production Setup

### Local Testing with Production Credentials:
1. **Set environment variables** in your local `.env`
2. **Start your server**: `npm run dev`
3. **Test OTP flow**:
   - Register a new user
   - Check your phone for SMS
   - Verify OTP works

### Production Testing:
1. **Deploy to production server**
2. **Set production environment variables**
3. **Test with real phone numbers**
4. **Monitor Twilio logs** for delivery status

## Step 7: Monitor and Maintain

### Twilio Console Monitoring:
1. **Message Logs**: https://console.twilio.com/us1/monitor/logs/messages
   - Track SMS delivery status
   - Monitor delivery rates
   - Identify failed deliveries

2. **Usage Dashboard**: https://console.twilio.com/us1/develop/usage
   - Monitor SMS usage and costs
   - Set up billing alerts
   - Track monthly spending

3. **Error Logs**: https://console.twilio.com/us1/monitor/logs/errors
   - Monitor API errors
   - Track authentication issues
   - Debug delivery problems

### Application Monitoring:
```javascript
// Monitor SMS service status
const status = smsService.getServiceStatus();
console.log('SMS Service Status:', status);
// Output: { configured: true, phoneNumber: '+91XXXXXXXXXX', service: 'Twilio SMS' }
```

## Step 8: Production Deployment

### Environment Variables Setup:
```bash
# Set production environment variables
export NODE_ENV=production
export TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
export TWILIO_AUTH_TOKEN=1234567890abcdef1234567890abcdef
export TWILIO_PHONE_NUMBER=+91XXXXXXXXXX
```

### Deployment Platforms:
- **Heroku**: Set config vars in dashboard
- **AWS**: Use Parameter Store or Secrets Manager
- **DigitalOcean**: Use App Platform environment variables
- **Vercel**: Set environment variables in project settings

## Step 9: Cost Management

### SMS Pricing (2024):
- **India to India**: ~₹0.50 per SMS
- **US to US**: ~$0.0075 per SMS
- **US to India**: ~$0.05-0.15 per SMS
- **International**: Varies by country

### Cost Optimization:
1. **Set billing alerts** in Twilio Console
2. **Monitor usage patterns**
3. **Implement rate limiting** in your app
4. **Use message templates** for consistency
5. **Consider bulk messaging** for notifications

### Billing Alerts Setup:
1. **Go to Billing**: https://console.twilio.com/us1/develop/billing
2. **Click "Alerts"**
3. **Set up alerts** for:
   - Monthly spending thresholds
   - Daily usage spikes
   - Failed delivery rates

## Step 10: Troubleshooting Production Issues

### Common Production Issues:

1. **SMS Not Delivering**:
   - Check phone number format (E.164)
   - Verify Twilio phone number is active
   - Check delivery logs in Twilio Console
   - Ensure sufficient account balance

2. **Authentication Errors**:
   - Verify Account SID and Auth Token
   - Check environment variables are set correctly
   - Ensure credentials are for production account

3. **Rate Limiting**:
   - Implement client-side rate limiting
   - Use Twilio's built-in rate limiting
   - Monitor for abuse patterns

4. **Cost Overruns**:
   - Set up billing alerts
   - Monitor usage patterns
   - Implement usage limits in your app

### Debug Commands:
```bash
# Check environment variables
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_PHONE_NUMBER

# Test Twilio connection
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
  --data-urlencode "To=+1234567890" \
  --data-urlencode "Body=Test message" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

## Step 11: Security Best Practices

### Credential Security:
- **Use environment variables** for all credentials
- **Never log credentials** in application logs
- **Rotate credentials** periodically
- **Use different credentials** for each environment

### Application Security:
- **Implement rate limiting** for OTP requests
- **Validate phone numbers** before sending SMS
- **Log security events** for monitoring
- **Use HTTPS** for all API calls

### Compliance:
- **Follow local regulations** for SMS marketing
- **Implement opt-out mechanisms**
- **Maintain delivery logs** for audit purposes
- **Respect user privacy** and data protection laws

## Step 12: Go Live Checklist

### Pre-Launch:
- [ ] Twilio account upgraded and verified
- [ ] Production phone number purchased
- [ ] Environment variables configured
- [ ] SMS service tested in production
- [ ] Billing alerts set up
- [ ] Monitoring dashboards configured
- [ ] Error handling tested
- [ ] Rate limiting implemented
- [ ] Security measures in place

### Post-Launch:
- [ ] Monitor SMS delivery rates
- [ ] Track usage and costs
- [ ] Monitor error logs
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Regular security reviews

## Support and Resources

### Twilio Support:
- **Documentation**: https://www.twilio.com/docs
- **Support Center**: https://support.twilio.com/
- **Community**: https://www.twilio.com/community
- **Status Page**: https://status.twilio.com/

### Additional Resources:
- **SMS Best Practices**: https://www.twilio.com/docs/messaging/guidelines
- **Delivery Guidelines**: https://www.twilio.com/docs/messaging/guidelines/delivery
- **Compliance Guide**: https://www.twilio.com/docs/messaging/guidelines/compliance

## Next Steps

1. **Complete account setup** and verification
2. **Purchase production phone number**
3. **Configure environment variables**
4. **Test SMS functionality**
5. **Deploy to production**
6. **Monitor and maintain**

