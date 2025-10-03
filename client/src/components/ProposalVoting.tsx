import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  Vote,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Proposal {
  _id: string;
  title: string;
  description: string;
  developerInfo?: {
    companyName?: string;
  };
  developer?: {
    companyName?: string;
  };
  developerProfile?: {
    company_name?: string;
  };
  corpusAmount?: number;
  rentAmount?: number;
  fsi?: number;
  timeline?: string;
  status: string;
}

interface ProposalVotingProps {
  projectId: string;
  proposals: Proposal[];
  userRole: 'society_member';
  votingDeadline?: string;
  isVotingOpen?: boolean;
}

interface VoteData {
  proposalId: string;
  vote: 'yes' | 'no';
  votedAt: string;
}

export default function ProposalVoting({ 
  projectId, 
  proposals, 
  userRole, 
  votingDeadline,
  isVotingOpen = true 
}: ProposalVotingProps) {
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no'>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserVotes();
  }, [projectId]);

  const fetchUserVotes = async () => {
    try {
      setLoading(true);
      
      // Fetch user's existing votes for this project using the correct endpoint
      const response = await apiClient.getMyVotingHistory(projectId);
      
      console.log('🗳️ Fetching user votes response:', response);
      
      if (response.data && response.data.votes) {
        const userVotes: Record<string, 'yes' | 'no'> = {};
        console.log('🗳️ Raw votes data:', response.data.votes);
        
        response.data.votes.forEach((vote: any) => {
          console.log('🗳️ Processing vote:', vote);
          
          // Filter for proposal_selection session and convert boolean to string
          if (vote.votingSession === 'proposal_selection' && vote.proposalId) {
            const proposalId = vote.proposalId.toString(); // Ensure it's a string
            const voteString = vote.vote === true ? 'yes' : vote.vote === false ? 'no' : 'abstain';
            
            console.log('🗳️ Vote details:', { proposalId, vote: vote.vote, voteString });
            
            if (voteString !== 'abstain') {
              userVotes[proposalId] = voteString as 'yes' | 'no';
            }
          }
        });
        console.log('🗳️ Final parsed user votes:', userVotes);
        setVotes(userVotes);
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'yes' | 'no') => {
    if (!isVotingOpen) {
      toast({
        title: "Voting Closed",
        description: "Voting is not currently open.",
        variant: "destructive",
      });
      return;
    }

    const deadlineStatus = getDeadlineStatus();
    if (deadlineStatus?.expired) {
      toast({
        title: "Voting Closed",
        description: "Voting deadline has passed.",
        variant: "destructive",
      });
      return;
    }

    console.log('🗳️ Submitting vote:', { proposalId, vote, projectId });

    setIsSubmitting(prev => ({ ...prev, [proposalId]: true }));

    try {
      const voteData = {
        redevelopmentProject: projectId,
        proposal: proposalId, // API expects 'proposal' field
        vote: vote,
        votingSession: 'proposal_selection'
      };

      console.log('🗳️ Vote data being sent:', voteData);

      const response = await apiClient.submitMemberVote(voteData);

      console.log('🗳️ Vote submission response:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state immediately
      setVotes(prev => ({
        ...prev,
        [proposalId]: vote
      }));

      // Refresh votes from server to ensure consistency
      await fetchUserVotes();

      toast({
        title: "Vote Recorded",
        description: `Your ${vote === 'yes' ? 'Yes' : 'No'} vote has been recorded for this proposal.`,
      });

    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const getDeadlineStatus = () => {
    if (!votingDeadline) return null;
    
    const now = new Date();
    const deadline = new Date(votingDeadline);
    const timeLeft = deadline.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return { expired: true, text: 'Voting Closed', variant: 'destructive' as const };
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return { expired: false, text: `${days} days left`, variant: 'default' as const };
    } else if (hours > 0) {
      return { expired: false, text: `${hours} hours left`, variant: 'secondary' as const };
    } else {
      const minutes = Math.floor(timeLeft / (1000 * 60));
      return { expired: false, text: `${minutes} minutes left`, variant: 'destructive' as const };
    }
  };

  const deadlineStatus = getDeadlineStatus();
  const totalProposals = proposals.length;
  const votedProposals = Object.keys(votes).length;
  const allVoted = votedProposals === totalProposals && totalProposals > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isVotingOpen) {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Voting is not currently open for this project.
        </AlertDescription>
      </Alert>
    );
  }

  // If user has voted on all proposals, show completion message instead of voting interface
  if (allVoted) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Voting Complete!</strong> You have successfully voted on all {totalProposals} proposals. Thank you for participating in the voting process.
          </AlertDescription>
        </Alert>
        
        {/* Show voting summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Your Voting Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proposals.map((proposal) => {
                const userVote = votes[proposal._id];
                const developerName = proposal.developerInfo?.companyName || 
                                     proposal.developer?.companyName || 
                                     proposal.developerProfile?.company_name || 
                                     'Developer';
                
                return (
                  <div key={proposal._id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div className="flex-1">
                      <h4 className="font-medium">{proposal.title}</h4>
                      <p className="text-sm text-muted-foreground">by {developerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={userVote === 'yes' ? 'default' : 'secondary'} className="flex items-center gap-1">
                        {userVote === 'yes' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {userVote === 'yes' ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Vote on Proposals
          </h3>
          <p className="text-sm text-muted-foreground">
            Vote Yes or No for each proposal ({votedProposals}/{totalProposals} completed)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUserVotes}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
            ) : (
              'Refresh'
            )}
          </Button>
          {deadlineStatus && (
            <Badge variant={deadlineStatus.variant} className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {deadlineStatus.text}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress */}
      {totalProposals > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{votedProposals}/{totalProposals} proposals voted</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(votedProposals / totalProposals) * 100}%` }}
            />
          </div>
        </div>
      )}


      {/* Proposals Voting */}
      <div className="space-y-4">
        {proposals.map((proposal) => {
          const hasVoted = votes[proposal._id];
          const isSubmittingVote = isSubmitting[proposal._id];
          const developerName = proposal.developerInfo?.companyName || 
                               proposal.developer?.companyName || 
                               proposal.developerProfile?.company_name || 
                               'Developer';

          return (
            <Card key={proposal._id} className={`${hasVoted ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{proposal.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">by {developerName}</p>
                  </div>
                  {hasVoted ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Voted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      <Vote className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Proposal Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {proposal.corpusAmount && (
                      <div>
                        <span className="text-muted-foreground">Corpus:</span>
                        <div className="font-medium">₹{proposal.corpusAmount.toLocaleString()}</div>
                      </div>
                    )}
                    {proposal.rentAmount && (
                      <div>
                        <span className="text-muted-foreground">Rent:</span>
                        <div className="font-medium">₹{proposal.rentAmount.toLocaleString()}</div>
                      </div>
                    )}
                    {proposal.fsi && (
                      <div>
                        <span className="text-muted-foreground">FSI:</span>
                        <div className="font-medium">{proposal.fsi}</div>
                      </div>
                    )}
                    {proposal.timeline && (
                      <div>
                        <span className="text-muted-foreground">Timeline:</span>
                        <div className="font-medium">{proposal.timeline}</div>
                      </div>
                    )}
                  </div>

                  {/* Voting Interface */}
                  {!hasVoted ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Your Vote:</Label>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVote(proposal._id, 'yes')}
                          disabled={isSubmittingVote || deadlineStatus?.expired}
                          className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300"
                        >
                          {isSubmittingVote && votes[proposal._id] === 'yes' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVote(proposal._id, 'no')}
                          disabled={isSubmittingVote || deadlineStatus?.expired}
                          className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300"
                        >
                          {isSubmittingVote && votes[proposal._id] === 'no' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          No
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Your Submitted Vote:</Label>
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        {votes[proposal._id] === 'yes' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-green-800">
                            You voted: <strong>{votes[proposal._id] === 'yes' ? 'Yes' : 'No'}</strong>
                          </div>
                          <div className="text-xs text-green-600">
                            {votes[proposal._id] === 'yes' ? 'You approved this proposal' : 'You rejected this proposal'}
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          Voted
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {proposals.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No proposals available for voting.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
