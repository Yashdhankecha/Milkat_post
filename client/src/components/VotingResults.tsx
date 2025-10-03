import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { 
  Trophy, 
  Users, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Calendar,
  Clock,
  Award,
  BarChart3,
  AlertCircle,
  Crown
} from 'lucide-react';

interface VotingResultsProps {
  projectId: string;
  userRole: 'society_owner' | 'society_member';
  onCloseVoting?: () => void;
  showCloseButton?: boolean;
}

interface FinalResults {
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  approvalPercentage: number;
  isApproved: boolean;
}

interface ProposalResult {
  proposal: {
    _id: string;
    title: string;
    description: string;
    corpusAmount: number;
    rentAmount: number;
    fsi: number;
    developer: {
      _id: string;
      phone: string;
      email: string;
    };
    developerInfo?: {
      companyName: string;
      experience: number;
      completedProjects: number;
    };
  };
  votes: {
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
  };
  totalVotes: number;
  approvalPercentage: number;
  isWinner: boolean;
}

interface ProjectData {
  id: string;
  title: string;
  votingStatus: string;
  votingClosedAt: string;
  selectedDeveloper: string;
  selectedProposal: string;
  status: string;
}

interface VotingResultsData {
  project: ProjectData;
  finalResults: FinalResults;
  proposalResults: ProposalResult[];
  winningProposal: ProposalResult | null;
}

export default function VotingResults({ 
  projectId, 
  userRole, 
  onCloseVoting,
  showCloseButton = false 
}: VotingResultsProps) {
  const [results, setResults] = useState<VotingResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingVoting, setClosingVoting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchResults();
  }, [projectId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFinalVotingResults(projectId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setResults(response.data);
    } catch (error: any) {
      console.error('Error fetching voting results:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch voting results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVoting = async () => {
    if (!results) return;

    try {
      setClosingVoting(true);
      const response = await apiClient.closeVoting(projectId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Voting has been closed and results finalized",
      });

      // Refresh results
      await fetchResults();
      
      // Notify parent component
      onCloseVoting?.();
    } catch (error: any) {
      console.error('Error closing voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to close voting",
        variant: "destructive",
      });
    } finally {
      setClosingVoting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading voting results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No voting results available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { project, finalResults, proposalResults, winningProposal } = results;

  return (
    <div className="space-y-6">
      {/* Project Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Voting Results - {project.title}
              </CardTitle>
              <CardDescription>
                Final results after voting closure
              </CardDescription>
            </div>
            {showCloseButton && userRole === 'society_owner' && project.votingStatus === 'open' && (
              <Button 
                onClick={handleCloseVoting}
                disabled={closingVoting}
                className="bg-red-600 hover:bg-red-700"
              >
                {closingVoting ? 'Closing...' : 'Close Voting'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{finalResults.totalVotes}</div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{finalResults.yesVotes}</div>
              <div className="text-sm text-gray-600">Yes Votes</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{finalResults.noVotes}</div>
              <div className="text-sm text-gray-600">No Votes</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Approval Rate</span>
              <span className="text-sm font-bold">{finalResults.approvalPercentage}%</span>
            </div>
            <Progress value={finalResults.approvalPercentage} className="h-2" />
          </div>

          {project.votingClosedAt && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Voting closed on {new Date(project.votingClosedAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Winner Announcement */}
      {winningProposal && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Crown className="h-5 w-5" />
              Winner Selected!
            </CardTitle>
            <CardDescription className="text-green-700">
              The society has selected a developer for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{winningProposal.proposal.title}</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {winningProposal.approvalPercentage}% Approval
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">{winningProposal.proposal.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Corpus Amount</div>
                  <div className="font-semibold">₹{winningProposal.proposal.corpusAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Rent Amount</div>
                  <div className="font-semibold">₹{winningProposal.proposal.rentAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">FSI</div>
                  <div className="font-semibold">{winningProposal.proposal.fsi}</div>
                </div>
              </div>

              {winningProposal.proposal.developerInfo && (
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-500 mb-1">Developer Information</div>
                  <div className="font-semibold">{winningProposal.proposal.developerInfo.companyName}</div>
                  <div className="text-sm text-gray-600">
                    {winningProposal.proposal.developerInfo.experience} years experience • {winningProposal.proposal.developerInfo.completedProjects} projects completed
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Proposals Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            All Proposals Results
          </CardTitle>
          <CardDescription>
            Detailed voting results for each developer proposal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposalResults.map((result, index) => (
              <div 
                key={result.proposal._id} 
                className={`p-4 rounded-lg border ${
                  result.isWinner 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      result.isWinner 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{result.proposal.title}</h3>
                      {result.proposal.developerInfo && (
                        <p className="text-sm text-gray-600">{result.proposal.developerInfo.companyName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.isWinner && (
                      <Badge className="bg-green-100 text-green-800">
                        <Crown className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {result.approvalPercentage}% Approval
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{result.votes.yesVotes}</div>
                    <div className="text-xs text-gray-500">Yes Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{result.votes.noVotes}</div>
                    <div className="text-xs text-gray-500">No Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">{result.votes.abstainVotes}</div>
                    <div className="text-xs text-gray-500">Abstain</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{result.totalVotes}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Approval Rate</span>
                    <span className="text-sm font-semibold">{result.approvalPercentage}%</span>
                  </div>
                  <Progress value={result.approvalPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Corpus:</span>
                    <span className="ml-1 font-medium">₹{result.proposal.corpusAmount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rent:</span>
                    <span className="ml-1 font-medium">₹{result.proposal.rentAmount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">FSI:</span>
                    <span className="ml-1 font-medium">{result.proposal.fsi}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* No Winner Alert */}
      {!winningProposal && project.votingStatus === 'closed' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No developer received the minimum required approval percentage ({finalResults.approvalPercentage}% achieved, minimum required not met).
            The society may need to restart the voting process or adjust the requirements.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
