import Notification from '../models/Notification.js';
import SocietyMember from '../models/SocietyMember.js';
import Society from '../models/Society.js';
import logger from './logger.js';

/**
 * Notification utility for redevelopment module
 * Centralized notification creation for all redevelopment events
 */

/**
 * Send notification to society owner
 */
export async function notifySocietyOwner(societyId, notification) {
  try {
    const society = await Society.findById(societyId);
    if (!society || !society.owner) {
      logger.warn(`Cannot send notification: Society ${societyId} not found or has no owner`);
      return null;
    }

    const notificationData = {
      recipient: society.owner,
      ...notification,
    };

    const createdNotification = await Notification.create(notificationData);
    logger.info(`Notification sent to society owner ${society.owner}: ${notification.type}`);
    return createdNotification;
  } catch (error) {
    logger.error(`Error sending notification to society owner: ${error.message}`);
    throw error;
  }
}

/**
 * Send notification to all society members
 */
export async function notifyAllMembers(societyId, notification) {
  try {
    const members = await SocietyMember.find({
      society: societyId,
      status: 'active',
    }).populate('user');

    if (members.length === 0) {
      logger.warn(`No active members found for society ${societyId}`);
      return [];
    }

    const notifications = await Promise.all(
      members.map(member =>
        Notification.create({
          recipient: member.user._id,
          ...notification,
        })
      )
    );

    logger.info(`Notifications sent to ${members.length} members of society ${societyId}: ${notification.type}`);
    return notifications;
  } catch (error) {
    logger.error(`Error sending notifications to society members: ${error.message}`);
    throw error;
  }
}

/**
 * Send notification to specific user
 */
export async function notifyUser(userId, notification) {
  try {
    const createdNotification = await Notification.create({
      recipient: userId,
      ...notification,
    });

    logger.info(`Notification sent to user ${userId}: ${notification.type}`);
    return createdNotification;
  } catch (error) {
    logger.error(`Error sending notification to user: ${error.message}`);
    throw error;
  }
}

/**
 * Notification templates for redevelopment events
 */

export function createProjectCreatedNotification(project, sender) {
  return {
    type: 'redevelopment_project_created',
    title: 'New Redevelopment Project Created',
    message: `A new redevelopment project "${project.title}" has been created for your society.`,
    sender,
    priority: 'high',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        status: project.status,
      },
    },
  };
}

export function createProjectUpdatedNotification(project, sender, updateType) {
  return {
    type: 'redevelopment_project_updated',
    title: 'Project Update',
    message: `Redevelopment project "${project.title}" has been updated: ${updateType}`,
    sender,
    priority: 'medium',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        updateType,
      },
    },
  };
}

export function createStatusChangedNotification(project, sender, oldStatus, newStatus) {
  return {
    type: 'redevelopment_status_changed',
    title: 'Project Status Changed',
    message: `Redevelopment project "${project.title}" status changed from ${oldStatus} to ${newStatus}`,
    sender,
    priority: 'high',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        oldStatus,
        newStatus,
      },
    },
  };
}

export function createProposalSubmittedNotification(proposal, project, sender) {
  return {
    type: 'developer_proposal_submitted',
    title: 'New Developer Proposal',
    message: `A new proposal "${proposal.title}" has been submitted for project "${project.title}"`,
    sender,
    priority: 'high',
    data: {
      redevelopmentProjectId: project._id,
      proposalId: proposal._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        proposalTitle: proposal.title,
        corpusAmount: proposal.corpusAmount,
        rentAmount: proposal.rentAmount,
      },
    },
  };
}

export function createProposalShortlistedNotification(proposal, project, sender) {
  return {
    type: 'developer_proposal_shortlisted',
    title: 'Proposal Shortlisted',
    message: `Your proposal "${proposal.title}" has been shortlisted for project "${project.title}"`,
    sender,
    priority: 'high',
    data: {
      redevelopmentProjectId: project._id,
      proposalId: proposal._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        proposalTitle: proposal.title,
      },
    },
  };
}

export function createProposalSelectedNotification(proposal, project, sender) {
  return {
    type: 'developer_proposal_selected',
    title: 'Proposal Selected!',
    message: `Congratulations! Your proposal "${proposal.title}" has been selected for project "${project.title}"`,
    sender,
    priority: 'urgent',
    data: {
      redevelopmentProjectId: project._id,
      proposalId: proposal._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        proposalTitle: proposal.title,
      },
    },
  };
}

export function createVotingOpenedNotification(project, sender, deadline) {
  return {
    type: 'voting_opened',
    title: 'Voting Now Open',
    message: `Voting is now open for "${project.title}". Please cast your vote before ${new Date(deadline).toLocaleDateString()}`,
    sender,
    priority: 'urgent',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        deadline: deadline,
      },
    },
    expiresAt: deadline,
  };
}

export function createVotingReminderNotification(project, sender, deadline, daysLeft) {
  return {
    type: 'voting_reminder',
    title: 'Voting Deadline Approaching',
    message: `Reminder: Only ${daysLeft} day${daysLeft > 1 ? 's' : ''} left to vote on "${project.title}"`,
    sender,
    priority: 'high',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        deadline: deadline,
        daysLeft,
      },
    },
  };
}

export function createVotingClosedNotification(project, sender) {
  return {
    type: 'voting_closed',
    title: 'Voting Closed',
    message: `Voting for "${project.title}" has been closed. Results will be announced soon.`,
    sender,
    priority: 'high',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
      },
    },
  };
}

export function createVotingResultsNotification(project, sender, results) {
  const approved = results.isApproved ? 'approved' : 'rejected';
  return {
    type: 'voting_results_published',
    title: 'Voting Results Announced',
    message: `Voting results for "${project.title}" are out. The project has been ${approved} with ${results.approvalPercentage}% approval.`,
    sender,
    priority: 'urgent',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        approvalPercentage: results.approvalPercentage,
        isApproved: results.isApproved,
        totalVotes: results.votesCast,
      },
    },
  };
}

export function createMilestoneCompletedNotification(project, sender, milestoneName) {
  return {
    type: 'project_milestone_completed',
    title: 'Milestone Completed',
    message: `Milestone "${milestoneName}" for project "${project.title}" has been completed.`,
    sender,
    priority: 'medium',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        milestoneName,
      },
    },
  };
}

export function createDocumentUploadedNotification(project, sender, documentName, documentType) {
  return {
    type: 'project_document_uploaded',
    title: 'New Document Uploaded',
    message: `A new ${documentType} document "${documentName}" has been uploaded to project "${project.title}"`,
    sender,
    priority: 'medium',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        documentName,
        documentType,
      },
    },
  };
}

export function createQueryRaisedNotification(project, sender, queryTitle) {
  return {
    type: 'project_query_raised',
    title: 'New Query Raised',
    message: `A new query "${queryTitle}" has been raised for project "${project.title}"`,
    sender,
    priority: 'medium',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        queryTitle,
      },
    },
  };
}

export function createQueryRespondedNotification(project, sender, queryTitle) {
  return {
    type: 'project_query_responded',
    title: 'Query Response',
    message: `Your query "${queryTitle}" for project "${project.title}" has been responded to`,
    sender,
    priority: 'medium',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        queryTitle,
      },
    },
  };
}

export function createUpdatePostedNotification(project, sender, updateTitle) {
  return {
    type: 'project_update_posted',
    title: 'Project Update',
    message: `New update posted for "${project.title}": ${updateTitle}`,
    sender,
    priority: updateTitle.includes('important') || updateTitle.includes('urgent') ? 'high' : 'medium',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        updateTitle,
      },
    },
  };
}

export function createAgreementSignedNotification(project, sender) {
  return {
    type: 'agreement_signed',
    title: 'Agreement Signed',
    message: `The development agreement for "${project.title}" has been signed successfully.`,
    sender,
    priority: 'urgent',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
      },
    },
  };
}

export function createConstructionStartedNotification(project, sender) {
  return {
    type: 'construction_started',
    title: 'Construction Started',
    message: `Construction work has started for project "${project.title}"`,
    sender,
    priority: 'urgent',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
      },
    },
  };
}

export function createConstructionMilestoneNotification(project, sender, milestone) {
  return {
    type: 'construction_milestone',
    title: 'Construction Milestone',
    message: `Construction milestone "${milestone}" achieved for project "${project.title}"`,
    sender,
    priority: 'high',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
        milestone,
      },
    },
  };
}

export function createProjectCompletedNotification(project, sender) {
  return {
    type: 'project_completed',
    title: 'Project Completed!',
    message: `Congratulations! The redevelopment project "${project.title}" has been successfully completed.`,
    sender,
    priority: 'urgent',
    data: {
      redevelopmentProjectId: project._id,
      societyId: project.society,
      metadata: {
        projectTitle: project.title,
      },
    },
  };
}

export default {
  notifySocietyOwner,
  notifyAllMembers,
  notifyUser,
  createProjectCreatedNotification,
  createProjectUpdatedNotification,
  createStatusChangedNotification,
  createProposalSubmittedNotification,
  createProposalShortlistedNotification,
  createProposalSelectedNotification,
  createVotingOpenedNotification,
  createVotingReminderNotification,
  createVotingClosedNotification,
  createVotingResultsNotification,
  createMilestoneCompletedNotification,
  createDocumentUploadedNotification,
  createQueryRaisedNotification,
  createQueryRespondedNotification,
  createUpdatePostedNotification,
  createAgreementSignedNotification,
  createConstructionStartedNotification,
  createConstructionMilestoneNotification,
  createProjectCompletedNotification,
};




