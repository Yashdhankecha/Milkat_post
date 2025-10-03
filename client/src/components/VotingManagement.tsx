import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { 
  Vote, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Square,
  Calendar,
  BarChart3
} from 'lucide-react';

interface VotingManagementProps {
  project: {
    _id: string;
    title: string;
    status: string;
    votingDeadline?: string;
    votingStatus?: string;
    minimumApprovalPercentage?: number;
  };
  onVotingUpdate: () => void;
  userRole: 'society_owner' | 'society_member';
}

export default function VotingManagement({ 
  project, 
  onVotingUpdate, 
  userRole 
}: VotingManagementProps) {
  const [loading, setLoading] = useState(false);
  const [votingDeadline, setVotingDeadline] = useState('');
  const [votingStats, setVotingStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (project.status === 'voting') {
      fetchVotingStats();
    }
  }, [project._id, project.status]);

  const fetchVotingStats = async () => {
    try {
      console.log('📊 Fetching voting stats for project:', project._id, 'session: proposal_selection');
      const response = await apiClient.getVotingStatistics(project._id, 'proposal_selection');
      console.log('📊 Voting stats response:', response);
      
      if (response.data?.statistics) {
        console.log('📊 Setting voting stats:', response.data.statistics);
        setVotingStats(response.data.statistics);
      } else {
        console.log('📊 No statistics found in response');
      }
    } catch (error) {
      console.error('Error fetching voting stats:', error);
    }
  };

  const handleStartVoting = async () => {
    if (!votingDeadline) {
      toast({
        title: "Validation Error",
        description: "Please set a voting deadline",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.startVoting(project._id, votingDeadline);
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Voting has been started successfully",
      });

      onVotingUpdate();
    } catch (error: any) {
      console.error('Error starting voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start voting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    setLoading(true);
    try {
      const response = await apiClient.closeVoting(project._id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Voting has been closed and results finalized",
      });

      onVotingUpdate();
    } catch (error: any) {
      console.error('Error closing voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to close voting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isVotingOpen = () => {
    return project.status === 'voting' && project.votingStatus !== 'closed';
  };

  const canStartVoting = () => {
    return project.status === 'proposals_received' && userRole === 'society_owner';
  };

  const canCloseVoting = () => {
    return isVotingOpen() && userRole === 'society_owner';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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

  return (
    <div className="space-y-6">
      {/* Current Voting Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Current Voting Status
          </CardTitle>
          <CardDescription>
            Manage voting process for this redevelopment project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={
                  isVotingOpen() ? 'default' : 
                  project.status === 'proposals_received' ? 'secondary' : 
                  'outline'
                }>
                  {isVotingOpen() ? 'Voting Open' : 
                   project.status === 'proposals_received' ? 'Ready for Voting' : 
                   project.status}
                </Badge>
                {project.minimumApprovalPercentage && (
                  <span className="text-sm text-muted-foreground">
                    Min. {project.minimumApprovalPercentage}% approval required
                  </span>
                )}
              </div>
            </div>
          </div>

          {project.votingDeadline && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {isVotingOpen() 
                  ? `Voting closes in ${calculateDaysRemaining(project.votingDeadline)} days (${formatDate(project.votingDeadline)})`
                  : `Voting deadline: ${formatDate(project.votingDeadline)}`
                }
              </span>
            </div>
          )}

          {/* Voting Statistics */}
          {votingStats ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voting Statistics</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchVotingStats}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{votingStats.approvalPercentage || 0}%</div>
                  <div className="text-sm text-muted-foreground">Approval</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{votingStats.totalVotes || 0}</div>
                  <div className="text-sm text-muted-foreground">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{votingStats.yesVotes || 0}</div>
                  <div className="text-sm text-muted-foreground">Yes Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{votingStats.noVotes || 0}</div>
                  <div className="text-sm text-muted-foreground">No Votes</div>
                </div>
              </div>
              
              {/* Additional Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{votingStats.totalMembers || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{votingStats.participationRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Participation</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">{votingStats.minimumApprovalRequired || 0}%</div>
                  <div className="text-sm text-muted-foreground">Required</div>
                </div>
              </div>

              {/* Status Message */}
              {votingStats.totalVotes === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No votes have been cast yet. Members can vote once the voting period begins.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Voting statistics are not available. Make sure voting has been started and members are eligible to vote.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Voting Controls - Only for Society Owners */}
      {userRole === 'society_owner' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Voting Controls
            </CardTitle>
            <CardDescription>
              Start or close voting for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canStartVoting() && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Proposals have been received. You can now start the voting process for society members.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="votingDeadline">Voting Deadline</Label>
                  <Input
                    id="votingDeadline"
                    type="datetime-local"
                    value={votingDeadline}
                    onChange={(e) => setVotingDeadline(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Set when voting should close for this project
                  </p>
                </div>

                <Button 
                  onClick={handleStartVoting} 
                  disabled={loading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {loading ? 'Starting Voting...' : 'Start Voting'}
                </Button>
              </div>
            )}

            {canCloseVoting() && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Voting is currently open. You can close it to finalize results and select the winning proposal.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleCloseVoting} 
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {loading ? 'Closing Voting...' : 'Close Voting'}
                </Button>
              </div>
            )}

            {!canStartVoting() && !canCloseVoting() && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {project.status === 'planning' || project.status === 'tender_open' 
                    ? 'Waiting for proposals to be submitted before voting can begin.'
                    : project.status === 'developer_selected' || project.status === 'construction'
                    ? 'Voting has been completed and a developer has been selected.'
                    : 'No voting actions available at this time.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information for Society Members */}
      {userRole === 'society_member' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Voting Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVotingOpen() ? (
              <Alert>
                <Vote className="h-4 w-4" />
                <AlertDescription>
                  Voting is currently open! You can cast your vote in the Overview tab. 
                  Make sure to vote before the deadline: {project.votingDeadline ? formatDate(project.votingDeadline) : 'TBD'}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {project.status === 'proposals_received' 
                    ? 'Proposals have been received. Waiting for voting to begin.'
                    : project.status === 'developer_selected'
                    ? 'Voting has been completed and a developer has been selected.'
                    : 'Voting is not currently open.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
