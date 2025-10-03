import cron from 'node-cron';
import RedevelopmentProject from '../models/RedevelopmentProject.js';

// Check for voting deadlines every 5 minutes
const checkVotingDeadlines = async () => {
  try {
    console.log('🕐 Checking for voting deadlines...');
    
    // Find all projects with open voting that have passed their deadline
    const projectsWithExpiredDeadlines = await RedevelopmentProject.find({
      votingStatus: 'open',
      status: 'voting',
      votingDeadline: { $lte: new Date() }
    });

    console.log(`📋 Found ${projectsWithExpiredDeadlines.length} projects with expired voting deadlines`);

    for (const project of projectsWithExpiredDeadlines) {
      try {
        console.log(`🕐 Processing expired deadline for project: ${project._id} (${project.title})`);
        const result = await project.checkAndAutoCloseVoting();
        
        if (result.closed) {
          console.log(`✅ Auto-closed voting for project ${project._id}: ${result.reason}`);
        }
      } catch (error) {
        console.error(`❌ Error auto-closing voting for project ${project._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in voting deadline check:', error.message);
  }
};

// Check for projects that might need auto-closing based on vote count
const checkVoteThresholds = async () => {
  try {
    console.log('📊 Checking for projects that might need auto-closing...');
    
    // Find all projects with open voting
    const openVotingProjects = await RedevelopmentProject.find({
      votingStatus: 'open',
      status: 'voting'
    });

    console.log(`📋 Found ${openVotingProjects.length} projects with open voting`);

    for (const project of openVotingProjects) {
      try {
        // Check if voting should be auto-closed
        const result = await project.checkAndAutoCloseVoting();
        
        if (result.closed) {
          console.log(`✅ Auto-closed voting for project ${project._id}: ${result.reason}`);
        }
      } catch (error) {
        console.error(`❌ Error checking auto-close for project ${project._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in vote threshold check:', error.message);
  }
};

// Initialize the voting scheduler
export const initializeVotingScheduler = () => {
  console.log('🚀 Initializing voting scheduler...');

  // Check voting deadlines every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('⏰ Running voting deadline check...');
    checkVotingDeadlines();
  });

  // Check vote thresholds every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    console.log('📊 Running vote threshold check...');
    checkVoteThresholds();
  });

  console.log('✅ Voting scheduler initialized');
  console.log('   - Deadline checks: Every 5 minutes');
  console.log('   - Threshold checks: Every 15 minutes');
};

// Manual trigger for testing
export const triggerVotingChecks = async () => {
  console.log('🔧 Manual trigger: Running voting checks...');
  await checkVotingDeadlines();
  await checkVoteThresholds();
  console.log('✅ Manual voting checks completed');
};

export default {
  initializeVotingScheduler,
  triggerVotingChecks,
  checkVotingDeadlines,
  checkVoteThresholds
};


