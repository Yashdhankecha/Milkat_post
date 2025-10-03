import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { 
  Vote, 
  CheckCircle, 
  X, 
  Users, 
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api';

interface VotingResults {
  totalMembers: number;
  votesCast: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  approvalPercentage: number;
  isApproved: boolean;
}

interface RedevelopmentVotingSystemProps {
  project: {
    _id: string;
    title: string;
    status: string;
    votingDeadline?: string;
    minimumApprovalPercentage: number;
    votingResults?: VotingResults;
  };
  proposals?: Array<{
    _id: string;
    title: string;
    developer: {
      companyName: string;
    };
    corpusAmount: number;
    rentAmount: number;
    fsi: number;
  }>;
  onVoteSubmit?: (voteData: any) => void;
  canVote?: boolean;
}

const RedevelopmentVotingSystem: React.FC<RedevelopmentVotingSystemProps> = ({
  project,
  proposals = [],
  onVoteSubmit,
  canVote = true
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [votingResults, setVotingResults] = useState<VotingResults | null>(null);
  const [userVote, setUserVote] = useState<string>('');
  const [voteReason, setVoteReason] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<string>('');

  useEffect(() => {
    fetchVotingResults();
  }, [project._id]);

  const fetchVotingResults = async () => {
    try {
      const response = await apiClient.getVotingResults(project._id, 'proposal_selection');
      
      if (response.error) {
        console.error('Error fetching voting results:', response.error);
        return;
      }

      setVotingResults(response.data.totals);
    } catch (error) {
      console.error('Error fetching voting results:', error);
    }
  };

  const handleVoteSubmit = async () => {
    if (!userVote) {
      toast({
        title: "Validation Error",
        description: "Please select your vote",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const voteData = {
        vote: userVote,
        voting_session: 'proposal_selection',
        proposal_id: selectedProposal || undefined,
        reason: voteReason.trim() || undefined
      };

      const response = await apiClient.submitVote(project._id, voteData);

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your vote has been submitted successfully",
      });

      onVoteSubmit?.(voteData);
      await fetchVotingResults();
      
      // Reset form
      setUserVote('');
      setVoteReason('');
      setSelectedProposal('');
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysRemaining = (deadline: string) => {
    const end = new Date(deadline);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isVotingOpen = () => {
    if (project.status !== 'voting') return false;
    if (!project.votingDeadline) return true;
    return new Date() <= new Date(project.votingDeadline);
  };

  const getVoteIcon = (vote: string) => {
    const icons: Record<string, React.ReactNode> = {
      yes: <ThumbsUp className="h-4 w-4" />,
      no: <ThumbsDown className="h-4 w-4" />,
      abstain: <Minus className="h-4 w-4" />,
    };
    return icons[vote] || <Vote className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Voting Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Voting Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="text-muted-foreground">
                  {isVotingOpen() ? 'Voting is currently open' : 'Voting is closed'}
                </p>
              </div>
              <Badge variant={isVotingOpen() ? 'default' : 'secondary'}>
                {isVotingOpen() ? 'Open' : 'Closed'}
              </Badge>
            </div>

            {project.votingDeadline && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  {isVotingOpen() 
                    ? `Voting closes in ${calculateDaysRemaining(project.votingDeadline)} days`
                    : `Voting closed on ${formatDate(project.votingDeadline)}`
                  }
                </span>
              </div>
            )}

            {votingResults && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{votingResults.approvalPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Approval</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{votingResults.votesCast}</div>
                  <div className="text-sm text-muted-foreground">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{votingResults.yesVotes}</div>
                  <div className="text-sm text-muted-foreground">Yes Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{votingResults.noVotes}</div>
                  <div className="text-sm text-muted-foreground">No Votes</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voting Results Chart */}
      {votingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Voting Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Approval Progress</span>
                <span className="text-sm text-muted-foreground">
                  {votingResults.approvalPercentage}% ({votingResults.yesVotes}/{votingResults.totalMembers} members)
                </span>
              </div>
              <Progress 
                value={votingResults.approvalPercentage} 
                className="h-3"
              />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Yes</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{votingResults.yesVotes}</div>
                  <div className="text-sm text-green-600">
                    {votingResults.totalMembers > 0 ? Math.round((votingResults.yesVotes / votingResults.totalMembers) * 100) : 0}%
                  </div>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">No</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{votingResults.noVotes}</div>
                  <div className="text-sm text-red-600">
                    {votingResults.totalMembers > 0 ? Math.round((votingResults.noVotes / votingResults.totalMembers) * 100) : 0}%
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Minus className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-800">Abstain</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600">{votingResults.abstainVotes}</div>
                  <div className="text-sm text-gray-600">
                    {votingResults.totalMembers > 0 ? Math.round((votingResults.abstainVotes / votingResults.totalMembers) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {votingResults.isApproved ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${votingResults.isApproved ? 'text-green-600' : 'text-red-600'}`}>
                    {votingResults.isApproved ? 'PROPOSAL APPROVED' : 'PROPOSAL REJECTED'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {votingResults.isApproved 
                    ? `Approved with ${votingResults.approvalPercentage}% votes (Required: ${project.minimumApprovalPercentage}%)`
                    : `Rejected with ${votingResults.approvalPercentage}% votes (Required: ${project.minimumApprovalPercentage}%)`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Form */}
      {isVotingOpen() && canVote && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Cast Your Vote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {proposals.length > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Select Developer Proposal</Label>
                <RadioGroup value={selectedProposal} onValueChange={setSelectedProposal}>
                  {proposals.map((proposal) => (
                    <div key={proposal._id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value={proposal._id} id={proposal._id} />
                      <Label htmlFor={proposal._id} className="flex-1 cursor-pointer">
                        <div className="space-y-1">
                          <div className="font-medium">{proposal.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {proposal.developerProfile?.company_name || proposal.developer.name || 'Developer'} • {formatCurrency(proposal.corpusAmount)} • FSI: {proposal.fsi}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="space-y-4">
              <Label className="text-base font-medium">Your Vote</Label>
              <RadioGroup value={userVote} onValueChange={setUserVote}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {getVoteIcon('yes')}
                      <span className="font-medium">Yes - Approve the proposal</span>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {getVoteIcon('no')}
                      <span className="font-medium">No - Reject the proposal</span>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="abstain" id="abstain" />
                  <Label htmlFor="abstain" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {getVoteIcon('abstain')}
                      <span className="font-medium">Abstain - No opinion</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voteReason">Reason (Optional)</Label>
              <Textarea
                id="voteReason"
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
                placeholder="Explain your vote (optional)"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleVoteSubmit} 
                disabled={loading || !userVote}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Vote className="h-4 w-4" />
                    Submit Vote
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setUserVote('');
                  setVoteReason('');
                  setSelectedProposal('');
                }}
              >
                Clear
              </Button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Voting Information:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• You can only vote once per voting session</li>
                    <li>• Your vote is confidential and cannot be changed once submitted</li>
                    <li>• A minimum of {project.minimumApprovalPercentage}% approval is required</li>
                    <li>• Voting results will be published after the deadline</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Closed Message */}
      {!isVotingOpen() && canVote && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Voting is Closed</h3>
            <p className="text-muted-foreground">
              The voting period for this proposal has ended. Results are displayed above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RedevelopmentVotingSystem;
