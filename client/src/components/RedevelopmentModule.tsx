import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Building2, 
  Plus, 
  FileText, 
  Users, 
  Vote, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Upload,
  Download,
  Edit,
  Trash2,
  MessageSquare,
  Star,
  Award,
  Target,
  BarChart3,
  X,
  Loader2,
  User,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import RedevelopmentForm from './RedevelopmentForm';
import RedevelopmentVotingSystem from './RedevelopmentVotingSystem';
import MemberQueries from './MemberQueries';
// New enhanced components
import VotingPanel from './VotingPanel';
import SimpleVotingPanel from './SimpleVotingPanel';
import VotingResults from './VotingResults';

interface RedevelopmentProject {
  _id: string;
  title: string;
  description: string;
  society: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  status: string;
  progress: number;
  estimatedBudget: number;
  corpusAmount: number;
  rentAmount: number;
  expectedAmenities: string[];
  timeline: {
    startDate?: string;
    expectedCompletionDate?: string;
    phases: Array<{
      name: string;
      description: string;
      startDate?: string;
      endDate?: string;
      status: string;
    }>;
  };
  documents: Array<{
    _id: string;
    name: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    isPublic: boolean;
  }>;
  updates: Array<{
    _id: string;
    title: string;
    description: string;
    postedBy: string;
    postedAt: string;
    isImportant: boolean;
  }>;
  queries: Array<{
    _id: string;
    title: string;
    description: string;
    raisedBy: string;
    raisedAt: string;
    status: string;
    response?: string;
    respondedBy?: string;
    respondedAt?: string;
  }>;
  votingResults?: {
    totalMembers: number;
    votesCast: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    approvalPercentage: number;
    isApproved: boolean;
  };
  selectedDeveloper?: string;
  selectedProposal?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeveloperProposal {
  _id: string;
  title: string;
  description: string;
  developer: {
    _id: string;
    phone: string;
  };
  corpusAmount: number;
  rentAmount: number;
  fsi: number;
  timeline?: string; // Simple timeline string (e.g., "21 months")
  proposedAmenities: Array<{
    name: string;
    description: string;
    category: string;
  }>;
  proposedTimeline?: {
    startDate?: string;
    completionDate?: string;
    phases: Array<{
      name: string;
      description: string;
      duration: number;
      milestones: string[];
    }>;
  };
  documents: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  developerInfo: {
    companyName: string;
    experience: number;
    completedProjects: number;
    certifications: string[];
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    website?: string;
  };
  status: string;
  evaluation?: {
    technicalScore: number;
    financialScore: number;
    timelineScore: number;
    overallScore: number;
    evaluatedBy: string;
    evaluatedAt: string;
    comments: string;
  };
  votingResults?: {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    approvalPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface RedevelopmentModuleProps {
  societyId?: string;
  isOwner?: boolean;
}

const RedevelopmentModule: React.FC<RedevelopmentModuleProps> = ({ societyId, isOwner = false }) => {
  const { user } = useAuth();
  const { joinProject, leaveProject, connected } = useSocket();
  const [projects, setProjects] = useState<RedevelopmentProject[]>([]);
  const [proposals, setProposals] = useState<DeveloperProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RedevelopmentProject | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<DeveloperProposal | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [votingState, setVotingState] = useState<Record<string, { vote: 'yes' | 'no' | null }>>({});
  const [votesFinalized, setVotesFinalized] = useState(false);
  const [votingResults, setVotingResults] = useState<any>(null);
  const [userSubmittedVotes, setUserSubmittedVotes] = useState<any[]>([]);
  const [votingResultsData, setVotingResultsData] = useState<any[]>([]);
  const [loadingProjectData, setLoadingProjectData] = useState(false);
  const [memberVotes, setMemberVotes] = useState<Record<string, { vote: 'yes' | 'no' }>>({});
  const [hasMemberVoted, setHasMemberVoted] = useState(false);

  useEffect(() => {
    // Clear all data when society changes
    setSelectedProject(null);
    setProposals([]);
    setVotingResultsData([]);
    setVotesFinalized(false);
    setVotingState({});
    setActiveTab('overview');
    
    fetchProjects();
  }, [societyId]);

  // Join/leave project rooms when project selection changes
  useEffect(() => {
    if (selectedProject && connected) {
      joinProject(selectedProject._id);
      console.log(`🔌 Joined project room: ${selectedProject._id}`);
      
      return () => {
        leaveProject(selectedProject._id);
        console.log(`🔌 Left project room: ${selectedProject._id}`);
      };
    }
  }, [selectedProject, connected, joinProject, leaveProject]);

  // Check if user has already voted and load existing votes
  useEffect(() => {
    const checkExistingVotes = async () => {
      if (selectedProject && proposals.length > 0 && user) {
        console.log('ðŸ” Checking existing votes for project:', selectedProject._id, 'user:', user.id);
        try {
          // Check if user has voted in this session - use my-votes endpoint instead
          const response = await apiClient.getMyVotingHistory(selectedProject._id);
          console.log('ðŸ“Š Vote check response:', response);
          
          if (response.data && response.data.length > 0) {
            console.log('ðŸ“‹ My vote documents:', response.data);
            
            // Find the vote document for this project
            const projectVoteDoc = response.data.find((doc: any) => 
              doc.redevelopmentProject._id === selectedProject._id
            );
            
            if (projectVoteDoc && projectVoteDoc.votes.length > 0) {
              console.log('ðŸ‘¤ User votes found for project:', projectVoteDoc.votes);
              
              // User has already voted, set the voting state and lock it
              const existingVotingState: Record<string, { vote: 'yes' | 'no' | null }> = {};
              const submittedVotes: any[] = [];
              
              projectVoteDoc.votes.forEach((vote: any) => {
                if (vote.proposalId) {
                  // Find the proposal details from the proposals array
                  const proposal = proposals.find(p => p._id === vote.proposalId._id);
                  if (proposal) {
                    existingVotingState[vote.proposalId._id] = {
                    vote: vote.vote
                  };
                    
                    submittedVotes.push({
                      proposal: proposal,
                      vote: vote.vote,
                      votedAt: vote.votedAt
                    });
                  }
                }
              });

              setVotingState(existingVotingState);
              setVotesFinalized(true);
              setUserSubmittedVotes(submittedVotes);
              
              console.log('Loaded existing votes:', existingVotingState);
              console.log('User submitted votes:', submittedVotes);
            }
          }
        } catch (error) {
          console.error('Error checking existing votes:', error);
          // If there's an error checking votes, we'll still allow voting
          // The backend will handle duplicate prevention
        }
      }
    };

    checkExistingVotes();
  }, [selectedProject, proposals, user]);

  // Check member voting status for society members
  useEffect(() => {
    if (selectedProject && user?.currentRole === 'society_member') {
      checkMemberVotingStatus(selectedProject._id);
    }
  }, [selectedProject, user?.currentRole]);

  // Fetch voting results when switching to voting tab
  useEffect(() => {
    if (activeTab === 'voting' && selectedProject) {
      fetchVotingResults(selectedProject._id);
    }
  }, [activeTab, selectedProject]);

  // Debug: Log voting results changes
  useEffect(() => {
    console.log('🔍 Voting results state changed:', {
      votingResults,
      votingResultsData,
      selectedProject: selectedProject?._id
    });
  }, [votingResults, votingResultsData, selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const queryParams = societyId ? `?society_id=${societyId}` : '';
      const response = await apiClient.getRedevelopmentProjects(queryParams);
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch redevelopment projects",
          variant: "destructive",
        });
        return;
      }

      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch redevelopment projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async (projectId: string) => {
    try {
      console.log('Fetching proposals for project:', projectId);
      const response = await apiClient.getDeveloperProposals(`?project_id=${projectId}`);
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch developer proposals",
          variant: "destructive",
        });
        return;
      }

      console.log('Proposals data for project', projectId, ':', response.data?.proposals);
      setProposals(response.data?.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch developer proposals",
        variant: "destructive",
      });
    }
  };

  const fetchVotingResults = async (projectId: string) => {
    try {
      console.log('🔍 Fetching voting results for project:', projectId);
      
      // Get voting statistics first - try different sessions
      let statsResponse;
      let sessionUsed = 'proposal_selection';
      
      try {
        statsResponse = await apiClient.getVotingStatistics(projectId, 'proposal_selection');
        console.log('📊 Voting statistics response for proposal_selection:', statsResponse);
      } catch (error) {
        console.log('⚠️ Failed to get stats for proposal_selection, trying without session:', error);
        try {
          statsResponse = await apiClient.getVotingStatistics(projectId);
          sessionUsed = 'no_session';
          console.log('📊 Voting statistics response without session:', statsResponse);
        } catch (error2) {
          console.log('⚠️ Failed to get stats without session:', error2);
          throw error2;
        }
      }
      
      const stats = statsResponse.data?.statistics;
      if (!stats) {
        console.log('📝 No voting statistics found');
        setVotingResultsData([]);
        return;
      }
      
      console.log('📊 Voting stats:', {
        totalVotes: stats.totalVotes,
        yesVotes: stats.yesVotes,
        noVotes: stats.noVotes,
        approvalPercentage: stats.approvalPercentage
      });
      
      // Get detailed votes if available (for owners)
      let detailedVotes: any[] = [];
      try {
        const detailedResponse = await apiClient.getProjectVotes(projectId, sessionUsed === 'proposal_selection' ? 'proposal_selection' : undefined, true);
        console.log('📋 Detailed votes response for session:', sessionUsed, detailedResponse);
        
        if (detailedResponse.data?.votes && Array.isArray(detailedResponse.data.votes)) {
          detailedVotes = detailedResponse.data.votes;
        }
      } catch (error) {
        console.log('⚠️ Could not fetch detailed votes (might not be owner):', error);
      }
      
      // Process votes by proposal
      const votesByProposal: Record<string, any> = {};
      
      // If we have detailed votes, process them
      if (detailedVotes.length > 0) {
        detailedVotes.forEach((vote: any) => {
          const proposalId = vote.proposalId?._id || vote.proposalId;
          if (proposalId) {
            if (!votesByProposal[proposalId]) {
              votesByProposal[proposalId] = {
                proposalId,
                proposalTitle: vote.proposalId?.title || 'Unknown Proposal',
                developerName: vote.proposalId?.developerInfo?.companyName || 'Unknown Developer',
                yesVotes: [],
                noVotes: [],
                totalVotes: 0
              };
            }
            
            // Add vote to appropriate category
            if (vote.vote === true || vote.vote === 'yes') {
              votesByProposal[proposalId].yesVotes.push({
                votedAt: vote.votedAt || new Date().toISOString()
              });
            } else if (vote.vote === false || vote.vote === 'no') {
              votesByProposal[proposalId].noVotes.push({
                votedAt: vote.votedAt || new Date().toISOString()
              });
            }
            
            votesByProposal[proposalId].totalVotes++;
          }
        });
      } else {
        // If no detailed votes, create basic results from proposals
        // This ensures we show all proposals even if no votes are cast yet
        proposals.forEach(proposal => {
          votesByProposal[proposal._id] = {
            proposalId: proposal._id,
            proposalTitle: proposal.title,
            developerName: proposal.developerInfo?.companyName || 'Unknown Developer',
            yesVotes: [],
            noVotes: [],
            totalVotes: 0
          };
        });
      }
      
      // Calculate statistics for each proposal
      const processedResults = Object.values(votesByProposal).map((proposal: any) => ({
        ...proposal,
        yesCount: proposal.yesVotes.length,
        noCount: proposal.noVotes.length,
        approvalRate: proposal.totalVotes > 0 ? Math.round((proposal.yesVotes.length / proposal.totalVotes) * 100) : 0
      }));
      
      console.log('✅ Processed voting results:', processedResults);
      console.log('🔍 Setting voting results data:', {
        votingResultsData: processedResults,
        overallStats: stats
      });
      
      setVotingResultsData(processedResults);
      
      // Also set the overall voting results
      setVotingResults({
        totalVotes: stats.totalVotes,
        results: processedResults
      });
      
      console.log('🔍 Final voting results state set:', {
        totalVotes: stats.totalVotes,
        resultsCount: processedResults.length
      });
      
    } catch (error) {
      console.error('Error fetching voting results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch voting results from database",
        variant: "destructive",
      });
    }
  };

  const handleViewProposal = (proposal: DeveloperProposal) => {
    console.log('View proposal clicked:', proposal);
    setSelectedProposal(proposal);
    setIsViewModalOpen(true);
  };


  const handleApproveProposal = async (proposal: DeveloperProposal) => {
    try {
      const response = await apiClient.approveProposal(proposal._id);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Proposal Approved",
        description: `Proposal from ${proposal.developerInfo?.companyName || 'Developer'} has been approved.`,
      });
      
      // Refresh proposals to show updated status
      if (selectedProject) {
        fetchProposals(selectedProject._id);
      }
    } catch (error: any) {
      console.error('Error approving proposal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve proposal",
        variant: "destructive",
      });
    }
  };

  const handleRejectProposal = async (proposal: DeveloperProposal) => {
    try {
      const response = await apiClient.rejectProposal(proposal._id);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Proposal Rejected",
        description: `Proposal from ${proposal.developerInfo?.companyName || 'Developer'} has been rejected.`,
      });
      
      // Refresh proposals to show updated status
      if (selectedProject) {
        fetchProposals(selectedProject._id);
      }
    } catch (error: any) {
      console.error('Error rejecting proposal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject proposal",
        variant: "destructive",
      });
    }
  };

  const handleSelectDeveloper = async (proposal: DeveloperProposal) => {
    const confirmed = confirm(
      `Are you sure you want to select "${proposal.developerInfo?.companyName || 'Developer'}" for this project? This action cannot be undone and will notify the developer.`
    );
    
    if (!confirmed) return;

    try {
      const response = await apiClient.selectProposal(proposal._id);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Developer Selected!",
        description: `${proposal.developerInfo?.companyName || 'Developer'} has been selected for the project. All developers have been notified via email.`,
      });
      
      // Refresh proposals and projects to show updated status
      if (selectedProject) {
        fetchProposals(selectedProject._id);
        fetchProjects(); // Refresh the projects list to update status
      }
    } catch (error: any) {
      console.error('Error selecting developer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to select developer",
        variant: "destructive",
      });
    }
  };

  const handleVote = (proposalId: string, vote: 'yes' | 'no') => {
    setVotingState(prev => ({
      ...prev,
      [proposalId]: { vote }
    }));
    
    // Here you can add API call to save the vote
    console.log(`Vote recorded for proposal ${proposalId}:`, { vote });
    
    toast({
      title: "Vote Recorded",
      description: `Your ${vote} vote has been recorded for this proposal.`,
    });
  };


  const validateVotes = () => {
    const missingVotes = proposals.filter(proposal => !votingState[proposal._id]?.vote);
    
    return { missingVotes };
  };

  const handleFinalizeVotes = async () => {
    const { missingVotes } = validateVotes();
    
    if (missingVotes.length > 0) {
      toast({
        title: "Incomplete Votes",
        description: `Please vote on all ${missingVotes.length} proposal(s) before finalizing.`,
        variant: "destructive",
      });
      return;
    }
    

    try {
      // First, check if user has already voted
      const existingVotesResponse = await apiClient.getProjectVotes(selectedProject?._id, 'proposal_selection');
      
      if (existingVotesResponse.data?.votes) {
        const userVotes = existingVotesResponse.data.votes.filter((vote: any) => 
          vote.member._id === user?.id || vote.member.toString() === user?.id
        );

        if (userVotes.length > 0) {
          // User has already voted, just finalize the UI state
          setVotesFinalized(true);
          toast({
            title: "Votes Already Submitted",
            description: "You have already voted on these proposals. Your votes are locked.",
          });
          return;
        }
      }

      // Submit all votes as a batch to the API
      const votesData = proposals.map(proposal => ({
          redevelopmentProject: selectedProject?._id,
          proposal: proposal._id,
          vote: votingState[proposal._id].vote,
          votingSession: 'proposal_selection' // This identifies the voting session
      }));

      console.log('Submitting votes to database as batch...');
      
      // Submit all votes to the database as a batch
      const response = await apiClient.submitMemberVotesBatch(votesData);
      
      // Check if votes were submitted successfully
      if (response.error) {
        if (response.error.includes('already voted') || response.error.includes('ALREADY_VOTED')) {
          // User has already voted
          setVotesFinalized(true);
          toast({
            title: "Votes Already Submitted",
            description: "You have already voted on these proposals. Your votes are locked.",
          });
          return;
        } else {
          // Other errors
          throw new Error(`Failed to submit votes: ${response.error}`);
        }
      }
      
      setVotesFinalized(true);
      
      // Store the submitted votes for display
      const submittedVotes = proposals.map(proposal => ({
        proposal: proposal,
        vote: votingState[proposal._id].vote,
        votedAt: new Date().toISOString()
      }));
      setUserSubmittedVotes(submittedVotes);
      
      toast({
        title: "Votes Finalized",
        description: "Your votes have been submitted and locked. You cannot change them now.",
      });
      
    } catch (error) {
      console.error('Error finalizing votes:', error);
      toast({
        title: "Error",
        description: "Failed to finalize votes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartVoting = async () => {
    if (!isOwner) {
      toast({
        title: "Unauthorized",
        description: "Only society owners can start voting.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProject) {
      toast({
        title: "Error",
        description: "No project selected.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update project status to start voting
      const response = await apiClient.put(`/redevelopment-projects/${selectedProject._id}`, {
        status: 'voting'
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error || "Failed to start voting",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Voting Started",
        description: "Voting is now open for members to vote on proposals.",
      });

      // Refresh project data
      await fetchProjects();
      
    } catch (error: any) {
      console.error('Error starting voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start voting. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if member has already voted
  const checkMemberVotingStatus = async (projectId: string) => {
    if (!user?.id || user.currentRole !== 'society_member') return;
    
    try {
      const response = await apiClient.get(`/member-votes/my-votes?project=${projectId}`);
      if (response.data?.votes && response.data.votes.length > 0) {
        const votesMap: Record<string, { vote: 'yes' | 'no' }> = {};
        response.data.votes.forEach((vote: any) => {
          if (vote.proposal || vote.proposalId) {
            const proposalId = vote.proposal || vote.proposalId;
            votesMap[proposalId] = {
              vote: vote.vote === true || vote.vote === 'yes' ? 'yes' : 'no'
            };
          }
        });
        setMemberVotes(votesMap);
        setHasMemberVoted(true);
      }
    } catch (error) {
      console.log('No existing votes found or error checking votes:', error);
    }
  };

  // Handle member voting
  const handleMemberVote = async (proposalId: string, vote: 'yes' | 'no') => {
    if (!selectedProject || !user?.id) return;

    try {
      // Check if user has already voted on this proposal
      if (memberVotes[proposalId]) {
        toast({
          title: "Already Voted",
          description: "You have already voted on this proposal.",
          variant: "destructive",
        });
        return;
      }

      // Submit vote to API
      const response = await apiClient.post('/member-votes', {
        redevelopmentProject: selectedProject._id,
        proposal: proposalId,
        vote: vote, // Send the string value directly ('yes', 'no', 'abstain')
        votingSession: 'default_session'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      setMemberVotes(prev => ({
        ...prev,
        [proposalId]: { vote }
      }));

      toast({
        title: "Vote Recorded",
        description: `Your ${vote} vote has been recorded successfully.`,
      });

      // Check if this was the last proposal to vote on
      const allProposalsVoted = proposals.every(proposal => 
        memberVotes[proposal._id] || proposal._id === proposalId
      );
      
      if (allProposalsVoted) {
        setHasMemberVoted(true);
        toast({
          title: "All Votes Submitted",
          description: "You have voted on all proposals. Thank you for participating!",
        });
      }

    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseVoting = async () => {
    if (!isOwner) {
      toast({
        title: "Unauthorized",
        description: "Only society owners can close voting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get voting statistics from the database
      const response = await apiClient.getVotingStatistics(selectedProject?._id, 'proposal_selection');
      
      if (response.error) {
        throw new Error(response.message || 'Failed to get voting results');
      }

      // Get detailed voting results for each proposal
      const proposalResults = await Promise.all(
        proposals.map(async (proposal) => {
          try {
            // Get votes for this specific proposal
            const proposalVotesResponse = await apiClient.getProjectVotes(
              selectedProject?._id, 
              'proposal_selection'
            );
            
            if (proposalVotesResponse.error) {
              return {
                proposalId: proposal._id,
                proposalTitle: proposal.title,
                developerName: proposal.developerInfo?.companyName || 'Developer',
                yesVotes: 0,
                noVotes: 0,
                approvalRate: 0
              };
            }

            // Filter votes for this specific proposal
            const votesForProposal = proposalVotesResponse.data?.votes?.filter(
              (vote: any) => vote.proposal?._id === proposal._id
            ) || [];

            const yesVotes = votesForProposal.filter((vote: any) => vote.vote === 'yes').length;
            const noVotes = votesForProposal.filter((vote: any) => vote.vote === 'no').length;
            const totalVotes = yesVotes + noVotes;
            const approvalRate = totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0;

            return {
              proposalId: proposal._id,
              proposalTitle: proposal.title,
              developerName: proposal.developerInfo?.companyName || 'Developer',
              yesVotes,
              noVotes,
              approvalRate
            };
          } catch (error) {
            console.error(`Error getting votes for proposal ${proposal._id}:`, error);
            return {
              proposalId: proposal._id,
              proposalTitle: proposal.title,
              developerName: proposal.developerInfo?.companyName || 'Developer',
              yesVotes: 0,
              noVotes: 0,
              approvalRate: 0
            };
          }
        })
      );

      const votingResults = {
        totalVotes: response.data?.statistics?.totalVotes || 0,
        results: proposalResults
      };
      
      setVotingResults(votingResults);
      
      // Update project status to close voting
      const statusUpdateResponse = await apiClient.updateRedevelopmentProjectStatus(
        selectedProject?._id, 
        'developer_selected'
      );
      
      if (statusUpdateResponse.error) {
        throw new Error('Failed to update project status');
      }
      
      // Update the local project state
      setSelectedProject(prev => prev ? { ...prev, status: 'developer_selected' } : null);
      
      toast({
        title: "Voting Closed",
        description: "Voting has been closed and results are now available.",
      });
      
      // Refresh voting results for all users
      await fetchVotingResults(selectedProject._id);
      
    } catch (error) {
      console.error('Error closing voting:', error);
      toast({
        title: "Error",
        description: "Failed to close voting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProjectSelect = async (project: RedevelopmentProject) => {
    setSelectedProject(project);
    setActiveTab('overview');
    setLoadingProjectData(true);
    
    // Clear previous proposals immediately when switching projects
    setProposals([]);
    setVotingResultsData([]);
    setVotesFinalized(false);
    setVotingState({});
    
    if (project.status === 'proposals_received' || project.status === 'voting' || project.status === 'developer_selected') {
      await Promise.all([
        fetchProposals(project._id),
        fetchVotingResults(project._id)
      ]);
    }
    
    setLoadingProjectData(false);
  };

  const handleViewMore = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const handleProjectCreated = (newProject: RedevelopmentProject) => {
    setProjects(prev => [newProject, ...prev]);
    setShowCreateForm(false);
    setSelectedProject(newProject);
    toast({
      title: "Success",
      description: "Redevelopment project created successfully",
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = confirm(
      'Are you sure you want to delete this redevelopment project? This action cannot be undone and will permanently remove all project data, proposals, and voting records.'
    );
    
    if (!confirmed) return;

    try {
      const response = await apiClient.deleteRedevelopmentProject(projectId);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Remove project from state
      setProjects(prev => prev.filter(p => p._id !== projectId));
      
      // Clear selected project if it was the deleted one
      if (selectedProject?._id === projectId) {
        setSelectedProject(null);
        setActiveTab('overview');
      }

      toast({
        title: "Project Deleted",
        description: "The redevelopment project has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-800',
      tender_open: 'bg-yellow-100 text-yellow-800',
      proposals_received: 'bg-purple-100 text-purple-800',
      voting: 'bg-orange-100 text-orange-800',
      developer_selected: 'bg-green-100 text-green-800',
      construction: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, React.ReactNode> = {
      planning: <Target className="h-4 w-4" />,
      tender_open: <Calendar className="h-4 w-4" />,
      proposals_received: <FileText className="h-4 w-4" />,
      voting: <Vote className="h-4 w-4" />,
      developer_selected: <CheckCircle className="h-4 w-4" />,
      construction: <Building2 className="h-4 w-4" />,
      completed: <Award className="h-4 w-4" />,
      cancelled: <AlertCircle className="h-4 w-4" />,
    };
    return statusIcons[status] || <Clock className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Redevelopment Projects</h2>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Redevelopment Projects</h2>
          <p className="text-muted-foreground mt-1">
            Manage your society's redevelopment initiatives
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        )}
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4">
              {isOwner 
                ? "Start by creating your first redevelopment project."
                : "No redevelopment projects available at the moment."
              }
            </p>
            {isOwner && (
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => (
            <div key={project._id}>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedProject?._id === project._id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleProjectSelect(project)}
              >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {project.society.name}, {project.society.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(project.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </Badge>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project._id);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">Timeline</div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {project.timeline?.expectedCompletionDate 
                            ? new Date(project.timeline.expectedCompletionDate).toLocaleDateString('en-IN')
                            : 'TBD'
                          }
                        </span>
                      </div>
                      {project.timeline?.startDate && (
                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(project.timeline.startDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">Updates</div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium">{project.updates.length}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">Queries</div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">{project.queries.length}</span>
                      </div>
                    </div>

                    {/* Documents count */}
                    {project.documents && project.documents.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Documents</div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{project.documents.length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* View More Button */}
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleViewMore(project._id, e)}
                      className="flex items-center gap-2"
                    >
                      {expandedProjectId === project._id ? (
                        <>
                          <X className="h-4 w-4" />
                          View Less
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          View More
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Expanded Project Details */}
            {expandedProjectId === project._id && (
              <Card className="mt-4 border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* For Members: Show tabs in expanded section */}
                  {!isOwner ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="results">Voting Results</TabsTrigger>
                        <TabsTrigger value="queries">Queries</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-6">
                        {loadingProjectData ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                              <p className="text-muted-foreground">Loading project data...</p>
                            </div>
                          </div>
                        ) : (
                          <ProjectOverview 
                            project={project} 
                            proposals={proposals} 
                            onViewProposal={handleViewProposal}
                            userRole={user?.currentRole}
                            votingResultsData={votingResultsData}
                            onVote={handleMemberVote}
                            myVotes={memberVotes}
                            hasVoted={hasMemberVoted}
                            votingOpen={project?.status === 'voting'}
                          />
                        )}
                      </TabsContent>

                      <TabsContent value="results" className="space-y-6">
                        {loadingProjectData ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                              <p className="text-muted-foreground">Loading voting results...</p>
                            </div>
                          </div>
                        ) : (
                          <VotingResults
                            projectId={project._id}
                            userRole="society_member"
                            showCloseButton={false}
                            onCloseVoting={() => {
                              // Refresh project data after closing voting
                              fetchProjects();
                            }}
                          />
                        )}
                      </TabsContent>

                      <TabsContent value="queries" className="space-y-6">
                        {loadingProjectData ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                              <p className="text-muted-foreground">Loading queries data...</p>
                            </div>
                          </div>
                        ) : (
                          <MemberQueries 
                            project={{
                              _id: project._id,
                              title: project.title,
                              queries: project.queries.map(q => ({
                                ...q,
                                status: q.status as "open" | "in_review" | "resolved" | "closed"
                              }))
                            }}
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    /* For Owners: Show basic project details in expanded section */
                    <div className="space-y-6">
                      {/* Project Description */}
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground">{project.description}</p>
                      </div>

                      {/* Project Timeline */}
                      {project.timeline && (
                        <div>
                          <h3 className="font-semibold mb-2">Timeline</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.timeline.startDate && (
                              <div>
                                <span className="text-sm text-muted-foreground">Start Date:</span>
                                <p className="font-medium">
                                  {new Date(project.timeline.startDate).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            )}
                            {project.timeline.expectedCompletionDate && (
                              <div>
                                <span className="text-sm text-muted-foreground">Expected Completion:</span>
                                <p className="font-medium">
                                  {new Date(project.timeline.expectedCompletionDate).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expected Amenities */}
                      {project.expectedAmenities && project.expectedAmenities.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Expected Amenities</h3>
                          <div className="flex flex-wrap gap-2">
                            {project.expectedAmenities.map((amenity, index) => (
                              <Badge key={index} variant="secondary">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Documents */}
                      {project.documents && project.documents.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Documents ({project.documents.length})</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {project.documents.slice(0, 4).map((document, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {document.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {document.type.replace('_', ' ')} Document
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = window.document.createElement('a');
                                    link.href = document.url;
                                    link.download = document.name;
                                    link.target = '_blank';
                                    window.document.body.appendChild(link);
                                    link.click();
                                    window.document.body.removeChild(link);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          {project.documents.length > 4 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              +{project.documents.length - 4} more documents
                            </p>
                          )}
                        </div>
                      )}

                      {/* Recent Updates */}
                      {project.updates && project.updates.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Recent Updates</h3>
                          <div className="space-y-3">
                            {project.updates.slice(0, 3).map((update, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium">{update.title}</h4>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(update.postedAt).toLocaleDateString('en-IN')}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{update.description}</p>
                              </div>
                            ))}
                          </div>
                          {project.updates.length > 3 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              +{project.updates.length - 3} more updates
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal/Tabs - Only for Owners */}
      {selectedProject && isOwner && (
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="voting">Voting Management</TabsTrigger>
              <TabsTrigger value="results">Voting Results</TabsTrigger>
              <TabsTrigger value="queries">Queries</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {loadingProjectData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project data...</p>
                  </div>
                </div>
              ) : (
              <ProjectOverview 
                project={selectedProject} 
                proposals={proposals} 
                onViewProposal={handleViewProposal}
                userRole={user?.currentRole}
                votingResultsData={votingResultsData}
                onVote={handleMemberVote}
                myVotes={memberVotes}
                hasVoted={hasMemberVoted}
                votingOpen={selectedProject?.status === 'voting'}
              />
              )}
            </TabsContent>

            {/* Voting Management Tab - Only for Society Owners */}
            {isOwner && (
              <TabsContent value="voting" className="space-y-6">
                {loadingProjectData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading voting data...</p>
                    </div>
                  </div>
                ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Vote className="h-5 w-5" />
                        Voting Management
                      </CardTitle>
                      <CardDescription>
                        Manage voting sessions and view voting results for this project.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedProject.status === 'voting' ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-800 mb-2">Voting is Currently Open</h3>
                            <p className="text-blue-600 text-sm mb-4">
                              Members can now vote on the submitted proposals. You can stop voting and select a developer when ready.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleCloseVoting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Stop Voting
                              </Button>
                              <Button
                                onClick={() => {
                                  // TODO: Implement select developer functionality
                                  toast({
                                    title: "Select Developer",
                                    description: "Developer selection functionality will be implemented soon.",
                                  });
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <User className="h-4 w-4 mr-2" />
                                Select Developer
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : selectedProject.status === 'developer_selected' ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-800 mb-2">Voting Completed</h3>
                          <p className="text-green-600 text-sm">
                            Voting has been completed and a developer has been selected for this project.
                          </p>
                        </div>
                      ) : selectedProject.status === 'proposals_received' ? (
                        <div className="space-y-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="font-semibold text-yellow-800 mb-2">Proposals Received - Ready to Start Voting</h3>
                            <p className="text-yellow-600 text-sm mb-4">
                              Proposals have been received and are ready for member voting. You can start the voting process now.
                            </p>
                            <Button
                              onClick={handleStartVoting}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <Vote className="h-4 w-4 mr-2" />
                              Start Voting
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-800 mb-2">Voting Not Available</h3>
                          <p className="text-gray-600 text-sm">
                            {selectedProject.status === 'planning' 
                              ? 'Voting will be available once the project moves to the proposal phase.'
                              : selectedProject.status === 'tender_open'
                              ? 'Voting will be available once proposals are received.'
                              : 'Voting is not available for this project status.'
                            }
                          </p>
                        </div>
                      )}

                       {/* Anonymous Voting Results by Developer */}
                       <div className="mt-6">
                         <h3 className="font-semibold mb-4">Anonymous Voting Results</h3>
                         <p className="text-sm text-muted-foreground mb-4">
                           Voting results organized by developer proposals. Member identities are kept anonymous.
                         </p>
                         
                         {votingResultsData.length > 0 ? (
                           <div className="space-y-6">
                             {votingResultsData.map((result, index) => (
                               <Card key={result.proposalId || index} className="border-l-4 border-l-blue-500">
                                 <CardHeader>
                                   <CardTitle className="text-lg">
                                     {result.developerName}
                                   </CardTitle>
                                   <CardDescription>{result.proposalTitle}</CardDescription>
                                 </CardHeader>
                                 <CardContent>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {/* Yes Votes */}
                                     <div>
                                       <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                         <CheckCircle className="h-4 w-4" />
                                         Yes Votes ({result.yesCount})
                                       </h4>
                                       <div className="space-y-2 max-h-40 overflow-y-auto">
                                         {result.yesVotes.length > 0 ? (
                                           result.yesVotes.map((vote: any, voteIndex: number) => (
                                             <div key={voteIndex} className="bg-green-50 p-3 rounded border-l-2 border-green-200">
                                               <p className="text-sm text-green-800">
                                                 Vote #{voteIndex + 1}
                                               </p>
                                               <p className="text-xs text-green-600 mt-1">Vote #{voteIndex + 1}</p>
                                             </div>
                                           ))
                                         ) : (
                                           <div className="text-sm text-muted-foreground italic">
                                             No yes votes yet
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                     
                                     {/* No Votes */}
                                     <div>
                                       <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                         <X className="h-4 w-4" />
                                         No Votes ({result.noCount})
                                       </h4>
                                       <div className="space-y-2 max-h-40 overflow-y-auto">
                                         {result.noVotes.length > 0 ? (
                                           result.noVotes.map((vote: any, voteIndex: number) => (
                                             <div key={voteIndex} className="bg-red-50 p-3 rounded border-l-2 border-red-200">
                                               <p className="text-sm text-red-800">
                                                 Vote #{voteIndex + 1}
                                               </p>
                                               <p className="text-xs text-red-600 mt-1">Vote #{voteIndex + 1}</p>
                                             </div>
                                           ))
                                         ) : (
                                           <div className="text-sm text-muted-foreground italic">
                                             No no votes yet
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                   
                                   {/* Summary Stats */}
                                   <div className="mt-4 pt-4 border-t">
                                     <div className="grid grid-cols-3 gap-4 text-center">
                                       <div>
                                         <div className="text-lg font-bold text-blue-600">
                                           {result.totalVotes}
                                         </div>
                                         <div className="text-xs text-muted-foreground">Total Votes</div>
                                       </div>
                                       <div>
                                         <div className="text-lg font-bold text-green-600">
                                           {result.approvalRate}%
                                         </div>
                                         <div className="text-xs text-muted-foreground">Approval Rate</div>
                                       </div>
                                       <div>
                                         <div className="text-lg font-bold text-gray-600">
                                           {result.totalVotes}
                                         </div>
                                         <div className="text-xs text-muted-foreground">Members Voted</div>
                                       </div>
                                     </div>
                                   </div>
                                 </CardContent>
                               </Card>
                             ))}
                           </div>
                         ) : (
                           <Card>
                             <CardContent className="text-center py-8">
                               <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                               <h3 className="text-lg font-semibold mb-2">No Voting Data Available</h3>
                               <p className="text-muted-foreground">
                                 {proposals.length > 0 
                                   ? "No votes have been cast for any proposals yet."
                                   : "No proposals available to show voting results."
                                 }
                               </p>
                             </CardContent>
                           </Card>
                         )}
                         
                         {/* Action Buttons */}
                         <div className="mt-4 flex justify-center gap-4">
                           <Button
                             onClick={() => {
                               if (selectedProject) {
                                 fetchVotingResults(selectedProject._id);
                                 toast({
                                   title: "Results Refreshed",
                                   description: "Voting results have been updated.",
                                 });
                               }
                             }}
                             variant="outline"
                             className="gap-2"
                           >
                             <BarChart3 className="h-4 w-4" />
                             Refresh Results
                           </Button>
                           
                         </div>
                         
                         {/* Developer Selection Section */}
                         {proposals.length > 0 && (
                           <div className="mt-6">
                             <h3 className="font-semibold mb-4">
                               {proposals.some(p => p.status === 'selected') ? 'Selected Developer' : 'Select Developer'}
                             </h3>
                             {proposals.some(p => p.status === 'selected') ? (
                               <p className="text-sm text-green-600 mb-4">
                                 ✓ A developer has been selected for this project. The selection process is complete.
                               </p>
                             ) : (
                               <p className="text-sm text-muted-foreground mb-4">
                                 Choose a developer from the available proposals based on voting results and your assessment.
                               </p>
                             )}
                             
                             <div className="space-y-4">
                               {proposals.map((proposal) => {
                                 const votingResult = votingResultsData.find(r => r.proposalId === proposal._id);
                                 const approvalRate = votingResult?.approvalRate || 0;
                                 const yesVotes = votingResult?.yesCount || 0;
                                 const noVotes = votingResult?.noCount || 0;
                                 
                                 const isSelected = proposal.status === 'selected';
                                 const isRejected = proposal.status === 'rejected';
                                 const cardBorderColor = isSelected ? 'border-l-green-500' : isRejected ? 'border-l-red-500' : 'border-l-blue-500';
                                 
                                 return (
                                   <Card key={proposal._id} className={`border-l-4 ${cardBorderColor} ${isSelected ? 'bg-green-50' : isRejected ? 'bg-red-50' : ''}`}>
                                     <CardContent className="p-4">
                                       <div className="flex items-start justify-between gap-4">
                                         <div className="flex-1">
                                           <div className="flex items-center gap-3 mb-2">
                                             <h4 className="font-semibold text-lg">{proposal.title}</h4>
                                             <Badge className={getStatusColor(proposal.status)}>
                                               {proposal.status.replace('_', ' ').toUpperCase()}
                                             </Badge>
                                             {isSelected && (
                                               <Badge className="bg-green-100 text-green-800 border-green-200">
                                                 <CheckCircle className="h-3 w-3 mr-1" />
                                                 SELECTED
                                               </Badge>
                                             )}
                                           </div>
                                           
                                           <p className="text-sm text-muted-foreground mb-3">
                                             by {proposal.developerInfo?.companyName || 'Developer'}
                                           </p>
                                           
                                           <div className="grid grid-cols-2 gap-4 mb-3">
                                             <div>
                                               <div className="text-xs text-muted-foreground">Corpus Amount</div>
                                               <div className="font-medium">₹{proposal.corpusAmount?.toLocaleString() || 'N/A'}</div>
                                             </div>
                                             <div>
                                               <div className="text-xs text-muted-foreground">Rent Amount</div>
                                               <div className="font-medium">₹{proposal.rentAmount?.toLocaleString() || 'N/A'}</div>
                                             </div>
                                           </div>
                                           
                                           {/* Voting Results Summary */}
                                           {votingResult && (
                                             <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                               <div className="grid grid-cols-3 gap-4 text-center">
                                                 <div>
                                                   <div className="text-lg font-bold text-green-600">{yesVotes}</div>
                                                   <div className="text-xs text-muted-foreground">Yes Votes</div>
                                                 </div>
                                                 <div>
                                                   <div className="text-lg font-bold text-red-600">{noVotes}</div>
                                                   <div className="text-xs text-muted-foreground">No Votes</div>
                                                 </div>
                                                 <div>
                                                   <div className="text-lg font-bold text-purple-600">{approvalRate}%</div>
                                                   <div className="text-xs text-muted-foreground">Approval Rate</div>
                                                 </div>
                                               </div>
                                             </div>
                                           )}
                                         </div>
                                         
                                         <div className="flex-shrink-0">
                                           <div className="flex gap-2">
                                               <Button
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => handleViewProposal(proposal)}
                                                 className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                               >
                                                 <FileText className="h-4 w-4 mr-1" />
                                                 View Details
                                               </Button>
                                               <Button
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => handleViewProposal(proposal)}
                                                 className="text-green-600 border-green-200 hover:bg-green-50"
                                               >
                                                 <FileText className="h-4 w-4 mr-1" />
                                                 View Proposal
                                               </Button>
                                             </div>
                                             
                                             {/* Only show select button if no developer has been selected yet */}
                                             {!proposals.some(p => p.status === 'selected') && proposal.status !== 'selected' && proposal.status !== 'rejected' && (
                                               <Button
                                                 onClick={() => handleSelectDeveloper(proposal)}
                                                 className="bg-green-600 hover:bg-green-700 text-white"
                                               >
                                                 <CheckCircle className="h-4 w-4 mr-1" />
                                                 Select Developer
                                               </Button>
                                             )}
                                             
                                             {proposal.status === 'selected' && (
                                               <Badge className="bg-green-100 text-green-800 border-green-200">
                                                 <CheckCircle className="h-3 w-3 mr-1" />
                                                 Selected
                                               </Badge>
                                             )}
                                             
                                             {proposal.status === 'rejected' && (
                                               <Badge className="bg-red-100 text-red-800 border-red-200">
                                                 <X className="h-3 w-3 mr-1" />
                                                 Rejected
                                               </Badge>
                                             )}
                                           </div>
                                         </div>
                                     </CardContent>
                                   </Card>
                                 );
                               })}
                             </div>
                           </div>
                         )}
                       </div>
                    </CardContent>
                  </Card>
                </div>
                )}
                </TabsContent>
            )}

            {/* Voting Results Tab - For both Owners and Members */}
            <TabsContent value="results" className="space-y-6">
              {loadingProjectData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading voting results...</p>
                  </div>
                </div>
              ) : (
                <VotingResults
                  projectId={selectedProject._id}
                  userRole={isOwner ? 'society_owner' : 'society_member'}
                  showCloseButton={isOwner && selectedProject.status === 'voting'}
                  onCloseVoting={() => {
                    // Refresh project data after closing voting
                    fetchProjects();
                    setActiveTab('overview');
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="queries" className="space-y-6">
              {loadingProjectData ? (
                <div className="flex items-center justify-center py-12">
                                      <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading queries data...</p>
                                      </div>
                                      </div>
              ) : (
              <MemberQueries 
                project={{
                  _id: selectedProject._id,
                  title: selectedProject.title,
                  queries: selectedProject.queries.map(q => ({
                    ...q,
                    status: q.status as "open" | "in_review" | "resolved" | "closed"
                  }))
                }}
              />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Proposal Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-6">
                <div>
                <h3 className="text-xl font-bold">{selectedProposal.title}</h3>
                <p className="text-muted-foreground mt-1">
                  by {selectedProposal.developerInfo?.companyName || 'Developer'}
                </p>
                </div>
                
                <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedProposal.description}</p>
                  </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Corpus Amount</h4>
                  <p className="text-lg font-bold text-green-600">
                    ₹{selectedProposal.corpusAmount?.toLocaleString() || 'N/A'}
                  </p>
              </div>
              <div>
                  <h4 className="font-semibold mb-1">Rent Amount</h4>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{selectedProposal.rentAmount?.toLocaleString() || 'N/A'}/month
                  </p>
                </div>
              </div>

              {selectedProposal.developerInfo && (
                <div>
                  <h4 className="font-semibold mb-2">Developer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>Company:</strong> {selectedProposal.developerInfo.companyName || 'N/A'}</div>
                    <div><strong>Experience:</strong> {selectedProposal.developerInfo.experience || 'N/A'}</div>
                    <div><strong>Completed Projects:</strong> {selectedProposal.developerInfo.completedProjects || 'N/A'}</div>
                    <div><strong>Contact Person:</strong> {selectedProposal.developerInfo.contactPerson || 'N/A'}</div>
                    <div><strong>Contact Phone:</strong> {selectedProposal.developerInfo.contactPhone || 'N/A'}</div>
                    <div><strong>Contact Email:</strong> {selectedProposal.developerInfo.contactEmail || 'N/A'}</div>
                    {selectedProposal.developerInfo.website && (
                      <div><strong>Website:</strong> <a href={selectedProposal.developerInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedProposal.developerInfo.website}</a></div>
                    )}
                  </div>
                </div>
              )}

              {/* Developer Documents */}
              {selectedProposal.documents && selectedProposal.documents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Developer Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProposal.documents.map((document, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {document.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {document.type.replace('_', ' ')} Document
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Direct download approach
                            const link = window.document.createElement('a');
                            link.href = document.url;
                            link.download = document.name;
                            link.target = '_blank';
                            window.document.body.appendChild(link);
                            link.click();
                            window.document.body.removeChild(link);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Download PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Project Form */}
      {showCreateForm && (
        <RedevelopmentForm
          societyId={societyId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={(project) => {
            setShowCreateForm(false);
            setProjects(prev => [...prev, project]);
            toast({
              title: "Success",
              description: "Redevelopment project has been created successfully.",
            });
          }}
        />
      )}
    </div>
  );
};

// Project Overview Component
const ProjectOverview: React.FC<{ 
  project: RedevelopmentProject; 
  proposals: DeveloperProposal[]; 
  onViewProposal: (proposal: DeveloperProposal) => void;
  userRole?: string;
  votingResultsData?: any[];
  onVote?: (proposalId: string, vote: 'yes' | 'no') => Promise<void>;
  myVotes?: Record<string, { vote: 'yes' | 'no' }>;
  hasVoted?: boolean;
  votingOpen?: boolean;
}> = ({ 
  project, 
  proposals, 
  onViewProposal, 
  userRole,
  votingResultsData = [],
  onVote,
  myVotes = {},
  hasVoted = false,
  votingOpen = false
}) => {
  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          
          {project.expectedAmenities.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Expected Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {project.expectedAmenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Documents */}
          {project.documents && project.documents.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Project Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.documents.map((document, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {document.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {document.type.replace('_', ' ')} Document
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Direct download approach
                        const link = window.document.createElement('a');
                        link.href = document.url;
                        link.download = document.name;
                        link.target = '_blank';
                        window.document.body.appendChild(link);
                        link.click();
                        window.document.body.removeChild(link);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Status</h3>
              <Badge variant="outline" className="text-sm">
                {project.status}
              </Badge>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Timeline</h3>
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  {project.timeline?.expectedCompletionDate 
                    ? `Expected completion: ${new Date(project.timeline.expectedCompletionDate).toLocaleDateString('en-IN')}`
                    : 'TBD'
                  }
                </p>
                {project.timeline?.startDate && (
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(project.timeline.startDate).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Created</h3>
              <p className="text-muted-foreground">
                {new Date(project.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Last Updated</h3>
              <p className="text-muted-foreground">
                {new Date(project.updatedAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Developer */}
      {proposals.some(p => p.status === 'selected') && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Selected Developer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedProposal = proposals.find(p => p.status === 'selected');
              if (!selectedProposal) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-green-800">{selectedProposal.title}</h3>
                      <p className="text-green-700 mb-2">
                        by {selectedProposal.developerInfo?.companyName || 'Developer'}
                      </p>
                      <p className="text-sm text-green-600">{selectedProposal.description}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      SELECTED
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-200">
                    <div>
                      <div className="text-sm font-medium text-green-700">Corpus Amount</div>
                      <div className="text-lg font-semibold text-green-800">₹{selectedProposal.corpusAmount?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700">Rent Amount</div>
                      <div className="text-lg font-semibold text-green-800">₹{selectedProposal.rentAmount?.toLocaleString() || 'N/A'}</div>
                    </div>
                  </div>
                  
                  {selectedProposal.developerInfo && (
                    <div className="pt-4 border-t border-green-200">
                      <h4 className="font-medium text-green-700 mb-2">Developer Information</h4>
                      <div className="text-sm text-green-600 space-y-1">
                        <div><strong>Company:</strong> {selectedProposal.developerInfo.companyName || 'N/A'}</div>
                        <div><strong>Experience:</strong> {selectedProposal.developerInfo.experience || 'N/A'}</div>
                        <div><strong>Completed Projects:</strong> {selectedProposal.developerInfo.completedProjects || 'N/A'}</div>
                        <div><strong>Contact Person:</strong> {selectedProposal.developerInfo.contactPerson || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Society Member Voting Section */}
      {userRole === 'society_member' && proposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              {votingOpen ? 'Vote on Proposals' : 'Voting Results'}
            </CardTitle>
            <CardDescription>
              {votingOpen 
                ? 'Cast your vote on the submitted proposals. You can only vote once per proposal.'
                : 'Voting has been completed. Here are the results.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {votingOpen && !hasVoted ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Voting Instructions</h3>
                  <ul className="text-blue-600 text-sm space-y-1">
                    <li>• You can vote Yes or No for each proposal</li>
                    <li>• You can only vote once per proposal</li>
                    <li>• Your vote will be recorded anonymously</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <Card key={proposal._id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{proposal.title}</h4>
                            <p className="text-muted-foreground mb-2">
                              by {proposal.developerInfo?.companyName || 'Developer'}
                            </p>
                            <p className="text-sm">{proposal.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">₹{proposal.corpusAmount?.toLocaleString() || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Corpus Amount</div>
                          </div>
                        </div>
                        
                        {/* Voting Interface */}
                        <div className="border-t pt-4">
                          <div className="flex items-center gap-4 mb-3">
                            <span className="font-medium">Your Vote:</span>
                            <div className="flex gap-2">
                              <Button
                                variant={myVotes[proposal._id]?.vote === 'yes' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onVote?.(proposal._id, 'yes')}
                                className={myVotes[proposal._id]?.vote === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Yes
                              </Button>
                              <Button
                                variant={myVotes[proposal._id]?.vote === 'no' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onVote?.(proposal._id, 'no')}
                                className={myVotes[proposal._id]?.vote === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                              >
                                <X className="h-4 w-4 mr-1" />
                                No
                              </Button>
                            </div>
                          </div>
                          
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : hasVoted ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✓ You Have Voted</h3>
                  <p className="text-green-600 text-sm">
                    Thank you for participating in the voting process. Your votes have been recorded.
                  </p>
                </div>
                
                {/* Show user's votes */}
                <div className="space-y-4">
                  {proposals.map((proposal) => {
                    const myVote = myVotes[proposal._id];
                    return (
                      <Card key={proposal._id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{proposal.title}</h4>
                              <p className="text-muted-foreground mb-2">
                                by {proposal.developerInfo?.companyName || 'Developer'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">₹{proposal.corpusAmount?.toLocaleString() || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">Corpus Amount</div>
                            </div>
                          </div>
                          
                          {myVote && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">Your Vote:</span>
                                <Badge className={myVote.vote === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {myVote.vote === 'yes' ? 'Yes' : 'No'}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {votingOpen ? 'Voting is not available at this time.' : 'Voting results will be displayed here once voting is completed.'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voting Results for All Users */}
      {!votingOpen && votingResultsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Voting Results
            </CardTitle>
            <CardDescription>
              Final voting results for all proposals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {votingResultsData.map((result, index) => (
                <Card key={result.proposalId || index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{result.title || 'Proposal'}</h4>
                        <p className="text-muted-foreground">
                          by {result.developerName || 'Developer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{result.approvalRate}%</div>
                        <div className="text-sm text-muted-foreground">Approval Rate</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{result.yesVotes || 0}</div>
                        <div className="text-xs text-muted-foreground">Yes Votes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{result.noVotes || 0}</div>
                        <div className="text-xs text-muted-foreground">No Votes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{result.totalVotes || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Votes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Proposals */}
      {proposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Proposals ({proposals.length})</CardTitle>
            <CardDescription>View all submitted proposals for this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div key={proposal._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{proposal.title}</h4>
                      <p className="text-muted-foreground mb-2">
                        by {proposal.developerInfo?.companyName || 'Developer'}
                      </p>
                      <p className="text-sm">{proposal.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={proposal.status === 'selected' ? 'default' : 'outline'}>
                        {proposal.status}
                      </Badge>
                      <div className="text-right text-sm">
                        <div className="font-medium">₹{proposal.corpusAmount?.toLocaleString() || 'N/A'}</div>
                        <div className="text-muted-foreground">Corpus</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewProposal(proposal)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Proposal
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default RedevelopmentModule;
