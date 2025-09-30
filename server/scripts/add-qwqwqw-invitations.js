import mongoose from 'mongoose';
import Society from '../models/Society.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Notification from '../models/Notification.js';
import config from '../config-loader.js';

mongoose.connect(config.MONGODB_URI);
const db = mongoose.connection;

db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find the qwqwqw society and owner
    const qwqwqwSociety = await Society.findOne({ name: /qwqwqw/i });
    const ownerUser = await User.findOne({ phone: '8866189928' });
    
    if (!qwqwqwSociety || !ownerUser) {
      console.log('Society or owner not found');
      return;
    }
    
    console.log('Adding invitations for qwqwqw society...');
    
    // Create some invitations
    const invitations = [
      {
        phone: '9876543001',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        type: 'society_member',
        status: 'sent',
        message: 'Welcome to our society! We have excellent amenities and a great community.'
      },
      {
        phone: '9876543002',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        type: 'broker',
        status: 'accepted',
        message: 'We would like to invite you as a broker to help our members with property transactions.'
      },
      {
        phone: '9876543003',
        name: 'Amit Construction',
        email: 'amit.construction@example.com',
        type: 'developer',
        status: 'pending',
        message: 'We are looking for a developer for our upcoming redevelopment project.'
      },
      {
        phone: '9876543004',
        name: 'Sneha Patel',
        email: 'sneha.patel@example.com',
        type: 'society_member',
        status: 'declined',
        message: 'Join our community and enjoy world-class amenities.'
      },
      {
        phone: '9876543005',
        name: 'Vikram Builders',
        email: 'vikram.builders@example.com',
        type: 'developer',
        status: 'sent',
        message: 'We need experienced developers for our smart society initiative.'
      }
    ];
    
    for (const inv of invitations) {
      try {
        // Check if invitation already exists
        const existingInvitation = await Invitation.findOne({
          society: qwqwqwSociety._id,
          invitedPhone: inv.phone
        });
        
        if (existingInvitation) {
          console.log(`Invitation for ${inv.phone} already exists, skipping...`);
          continue;
        }
        
        // Check if user is registered
        const existingUser = await User.findOne({ phone: inv.phone });
        const isUserRegistered = !!existingUser;
        
        const invitation = new Invitation({
          society: qwqwqwSociety._id,
          invitedBy: ownerUser._id,
          invitedPhone: inv.phone,
          invitedName: inv.name,
          invitedEmail: inv.email,
          invitationType: inv.type,
          status: inv.status,
          message: inv.message,
          isUserRegistered,
          registeredUserId: existingUser ? existingUser._id : null,
          sentAt: inv.status !== 'pending' ? new Date() : null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          acceptedAt: inv.status === 'accepted' ? new Date() : null,
          declinedAt: inv.status === 'declined' ? new Date() : null,
          metadata: {
            source: 'dashboard',
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        await invitation.save();
        console.log(`✅ Created invitation: ${inv.type} for ${inv.name} (${inv.phone}) - Status: ${inv.status}`);
        
      } catch (error) {
        console.error(`Error creating invitation for ${inv.phone}:`, error.message);
      }
    }
    
    // Add some notifications for the owner
    const notifications = [
      {
        type: 'property_inquiry',
        title: 'New Property Inquiry',
        message: 'Someone is interested in your qwqwqw society property listing.',
        priority: 'high',
        isRead: false
      },
      {
        type: 'system_alert',
        title: 'Society Profile Updated',
        message: 'Your qwqwqw society profile has been updated successfully.',
        priority: 'medium',
        isRead: true
      },
      {
        type: 'property_share',
        title: 'Society Shared',
        message: 'Your qwqwqw society listing was shared 3 times this week.',
        priority: 'low',
        isRead: false
      }
    ];
    
    for (const notif of notifications) {
      try {
        const notification = new Notification({
          recipient: ownerUser._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          priority: notif.priority,
          isRead: notif.isRead,
          readAt: notif.isRead ? new Date() : null,
          data: {
            societyId: qwqwqwSociety._id,
            timestamp: new Date()
          }
        });
        
        await notification.save();
        console.log(`✅ Created notification: ${notif.title} - Priority: ${notif.priority}`);
        
      } catch (error) {
        console.error(`Error creating notification:`, error.message);
      }
    }
    
    console.log('\n✅ qwqwqw society setup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Society: ${qwqwqwSociety.name}`);
    console.log(`   - Owner: ${ownerUser.phone}`);
    console.log(`   - Members: 9 total`);
    console.log(`   - Invitations: 5 created`);
    console.log(`   - Notifications: 3 created`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});
