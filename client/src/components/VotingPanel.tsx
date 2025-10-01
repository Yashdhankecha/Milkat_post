import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Calendar, 
  Users, 
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

interface VotingPanelProps {
  projectId: string;
  session: string;
  userRole: 'society_owner' | 'society_member';
  votingDeadline?: string;
  isVotingOpen?: boolean;
  projectTitle?: string;
  projectDescription?: string;
  votingSubject?: string; // What you're voting on (e.g., "Project Approval", "Developer Selection")
}

interface VotingStats {
  totalMembers: number;
  votesCast: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  approvalPercentage: number;
  participationRate: number;
}

interface MyVote {
  vote: 'yes' | 'no' | 'abstain';
  reason?: string;
  votedAt: string;
}

export default function VotingPanel({ 
  projectId, 
  session, 
  userRole, 
  votingDeadline,
  isVotingOpen = true,
  projectTitle,
  projectDescription,
  votingSubject = "this proposal"
}: VotingPanelProps) {
  const { toast } = useToast();
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | 'abstain' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myVote, setMyVote] = useState<MyVote | null>(null);
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVotingData();
  }, [projectId, session]);

  const fetchVotingData = async () => {
    try {
      setLoading(true);
      
      // Fetch my vote if I'm a member
      if (userRole === 'society_member') {
        try {
          const myVoteData = await apiClient.getMyVote(projectId, session);
          // Only set myVote if the data is valid
          if (myVoteData && myVoteData.vote && myVoteData.vote !== 'Unknown') {
            setMyVote(myVoteData);
          } else {
            setMyVote(null);
          }
        } catch (error: any) {
          // 404 means no vote cast yet, which is fine
          if (error.status !== 404) {
            console.error('Error fetching my vote:', error);
          }
          setMyVote(null);
        }
      }

      // Fetch voting statistics
      const statsData = await apiClient.getVotingStatistics(projectId, session);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching voting data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load voting data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedVote) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select your vote.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.submitMemberVote({
        redevelopmentProject: projectId,
        votingSession: session,
        vote: selectedVote,
        reason: reason.trim() || undefined,
      });

      toast({
        title: 'Vote Submitted',
        description: 'Your vote has been recorded successfully.',
      });

      // Refresh data
      await fetchVotingData();
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit vote. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeadlineStatus = () => {
    if (!votingDeadline) return null;
    const deadline = new Date(votingDeadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { expired: true, text: 'Voting Closed', variant: 'destructive' as const };
    if (daysLeft === 0) return { expired: false, text: 'Last Day to Vote', variant: 'destructive' as const };
    if (daysLeft <= 3) return { expired: false, text: `${daysLeft} days left`, variant: 'warning' as const };
    return { expired: false, text: `${daysLeft} days left`, variant: 'default' as const };
  };

  const deadlineStatus = getDeadlineStatus();
  const hasVoted = !!myVote && myVote.vote && myVote.vote !== 'Unknown';
  const canVote = userRole === 'society_member' && isVotingOpen && !hasVoted && !deadlineStatus?.expired;

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

  return (
    <div className="space-y-6">

      {/* Voting Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Voting
              </CardTitle>
              <CardDescription>
                {session.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </CardDescription>
            </div>
            {deadlineStatus && (
              <Badge variant={deadlineStatus.variant} className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {deadlineStatus.text}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Voting Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Voting Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Participation Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Participation Rate</span>
                <span className="text-sm font-bold">{stats.participationRate}%</span>
              </div>
              <Progress value={stats.participationRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.votesCast} of {stats.totalMembers} members voted
              </p>
            </div>

            {/* Vote Distribution */}
            {stats.votesCast > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-green-600">{stats.yesVotes}</div>
                  <div className="text-xs text-muted-foreground">Yes</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-600">{stats.noVotes}</div>
                  <div className="text-xs text-muted-foreground">No</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <MinusCircle className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-600">{stats.abstainVotes}</div>
                  <div className="text-xs text-muted-foreground">Abstain</div>
                </div>
              </div>
            )}

            {/* Approval Percentage */}
            {stats.votesCast > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Current Approval</span>
                </div>
                <span className="text-lg font-bold text-primary">{stats.approvalPercentage}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Vote Display (if already voted) */}
      {hasVoted && myVote && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">You voted: {myVote.vote?.toUpperCase() || 'Unknown'}</div>
            {myVote.reason && (
              <div className="text-sm text-muted-foreground mt-1">
                Reason: {myVote.reason}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              Voted on {new Date(myVote.votedAt).toLocaleString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Voting Form (if can vote) */}
      {canVote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cast Your Vote</CardTitle>
            <CardDescription>
              Select your choice and optionally provide a reason
            </CardDescription>
          </CardHeader>
          
          {/* What You're Voting On */}
          {(projectTitle || votingSubject) && (
            <CardContent className="pt-0">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      You are voting on:
                    </h4>
                    {projectTitle && (
                      <p className="text-blue-800 dark:text-blue-200 font-medium">
                        Project: {projectTitle}
                      </p>
                    )}
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Subject: {votingSubject}
                    </p>
                    {projectDescription && (
                      <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                        {projectDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
          <CardContent className="space-y-4">
            <RadioGroup value={selectedVote || ''} onValueChange={(value) => setSelectedVote(value as any)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-green-50 dark:hover:bg-green-950 cursor-pointer">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="flex-1 cursor-pointer flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Yes - I Approve</div>
                    <div className="text-xs text-muted-foreground">Support {votingSubject}</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="flex-1 cursor-pointer flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium">No - I Disapprove</div>
                    <div className="text-xs text-muted-foreground">Reject {votingSubject}</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                <RadioGroupItem value="abstain" id="abstain" />
                <Label htmlFor="abstain" className="flex-1 cursor-pointer flex items-center gap-2">
                  <MinusCircle className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Abstain - No Opinion</div>
                    <div className="text-xs text-muted-foreground">Neither support nor oppose {votingSubject}</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain your vote (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reason.length}/500 characters
              </p>
            </div>

            <Button 
              onClick={handleSubmitVote} 
              disabled={!selectedVote || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cannot Vote Message */}
      {!canVote && !hasVoted && (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {userRole !== 'society_member' 
              ? 'Only society members can vote.' 
              : deadlineStatus?.expired 
              ? 'Voting has ended for this session.' 
              : 'Voting is currently closed.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
