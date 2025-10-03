# Twilio SMS Setup Guide for Nestly Estate

This guide will help you set up Twilio SMS services for OTP verification in your Nestly Estate application.

## Prerequisites

- A Twilio account (free trial available)
- A valid phone number for receiving SMS
- Access to your server environment configuration

## Step 1: Create a Twilio Account

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account or log in if you already have one
3. Complete the phone number verification process

## Step 2: Get Your Twilio Credentials

1. In the Twilio Console, go to **Account > API Keys & Tokens**
2. Copy your **Account SID** and **Auth Token**
3. Note: Keep these credentials secure and never commit them to version control

## Step 3: Purchase a Phone Number (Optional for Trial)

### For Production Use:
1. Go to **Phone Numbers > Manage > Buy a number**
2. Choose a phone number that supports SMS
3. Purchase the number (costs around $1/month + usage fees)

### For Testing (Free Trial):
- Twilio provides a trial phone number that you can use for testing
- You can only send SMS to verified phone numbers during the trial period

## Step 4: Configure Environment Variables

1. Copy the `env.example` file to `.env` in your server directory:
   ```bash
   cd server
   cp env.example .env
   ```

2. Update the `.env` file with your Twilio credentials:
   ```env
   # Twilio SMS Configuration
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. Replace the values with your actual Twilio credentials:
   - `TWILIO_ACCOUNT_SID`: Your Account SID from Step 2
   - `TWILIO_AUTH_TOKEN`: Your Auth Token from Step 2
   - `TWILIO_PHONE_NUMBER`: Your purchased Twilio phone number or trial number

## Step 5: Verify Phone Numbers (Trial Account)

If you're using a Twilio trial account:

1. Go to **Phone Numbers > Manage > Verified Caller IDs**
2. Add the phone numbers you want to test with
3. Twilio will send a verification code to each number
4. Enter the verification code to verify the number

## Step 6: Test the Integration

1. Start your server:
   ```bash
   cd server
   npm run dev
   ```

2. Test the OTP functionality:
   - Try registering a new user
   - Try logging in with an existing user
   - Check your phone for the OTP SMS

## Step 7: Monitor Usage and Costs

1. Go to **Monitor > Logs > Messages** to see SMS delivery status
2. Check **Monitor > Usage** to track your SMS usage
3. Set up billing alerts in **Billing > Alerts**

## Troubleshooting

### Common Issues:

1. **"Phone number not verified" error**
   - Solution: Verify the phone number in Twilio Console (trial accounts only)

2. **"Invalid phone number format" error**
   - Solution: Ensure phone numbers are in E.164 format (+1234567890)

3. **SMS not being delivered**
   - Check the Twilio logs for delivery status
   - Verify your phone number is correct
   - Check if you've exceeded rate limits

4. **Environment variables not loading**
   - Ensure your `.env` file is in the server directory
   - Restart your server after updating environment variables

### Development vs Production:

- **Development**: The SMS service will fall back to mock SMS if Twilio credentials are not configured
- **Production**: Real SMS will be sent via Twilio

## Security Best Practices

1. **Never commit credentials**: Keep your `.env` file in `.gitignore`
2. **Use environment-specific configs**: Different credentials for dev/staging/production
3. **Monitor usage**: Set up alerts for unusual SMS activity
4. **Rate limiting**: Consider implementing rate limiting for OTP requests

## Cost Considerations

- **Trial Account**: Free credits for testing
- **Production**: ~$0.0075 per SMS in the US
- **International**: Varies by country (check Twilio pricing)

## Support

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Support](https://support.twilio.com/)
- [Twilio Community](https://www.twilio.com/community)

## Implementation Details

The SMS service is implemented in `server/services/smsService.js` and includes:

- Automatic phone number formatting (E.164)
- Fallback to mock SMS in development
- Error handling and logging
- Support for both OTP and invitation SMS

The service is integrated into:
- User authentication (`/send-otp`, `/verify-otp`)
- User registration (`/signup`, `/signup-new-role`)
- Society invitations (`/invitations`)

## Next Steps

1. Set up your Twilio account and get credentials
2. Configure environment variables
3. Test with verified phone numbers
4. Deploy to production with proper environment configuration
5. Monitor usage and costs
