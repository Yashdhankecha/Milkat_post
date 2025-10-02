import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { 
  Building2, 
  TrendingUp, 
  Calendar, 
  IndianRupee,
  FileText,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import VotingPanel from './VotingPanel';

interface Proposal {
  _id: string;
  title: string;
  description: string;
  developer: {
    _id: string;
    phone: string;
    name?: string;
  };
  developerProfile?: {
    fullName: string;
    company_name?: string;
  };
  corpusAmount: number;
  rentAmount: number;
  fsi: number;
  timeline: string; // Simple timeline string
  proposedAmenities?: Array<{
    name: string;
    description: string;
    category: string;
  }>;
  proposedTimeline?: {
    startDate: string;
    completionDate: string;
    phases: Array<{
      name: string;
      description: string;
      duration: number;
    }>;
  };
  financialBreakdown?: {
    constructionCost: number;
    amenitiesCost: number;
    legalCost: number;
    contingencyCost: number;
    totalCost: number;
  };
  developerInfo: {
    companyName: string;
    experience: number;
    completedProjects: number;
    certifications: string[];
  };
  documents: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  evaluation?: {
    technicalScore: number;
    financialScore: number;
    timelineScore: number;
    overallScore: number;
    comments: string;
  };
  votingResults?: {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    approvalPercentage: number;
  };
  status: string;
}

interface ProposalVotingComparisonProps {
  projectId: string;
  userRole: 'society_owner' | 'society_member';
  votingDeadline?: string;
  isVotingOpen?: boolean;
}

export default function ProposalVotingComparison({ 
  projectId, 
  userRole,
  votingDeadline,
  isVotingOpen = true 
}: ProposalVotingComparisonProps) {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comparison');

  useEffect(() => {
    fetchProposals();
  }, [projectId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDeveloperProposals(`?project_id=${projectId}`);
      setProposals(response.data?.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load proposals. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimelineDuration = (proposal: Proposal) => {
    // Use the simple timeline string if available, otherwise return default
    if (proposal.timeline) {
      return proposal.timeline;
    }
    
    // Fallback to proposedTimeline if it exists
    if (proposal.proposedTimeline?.startDate && proposal.proposedTimeline?.completionDate) {
      const start = new Date(proposal.proposedTimeline.startDate);
      const end = new Date(proposal.proposedTimeline.completionDate);
      const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return `${months} months`;
    }
    
    return 'Timeline not specified';
  };

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

  if (proposals.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No developer proposals have been submitted yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="voting">Vote</TabsTrigger>
        </TabsList>

        {/* Comparison Table */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Comparison</CardTitle>
              <CardDescription>
                Compare all {proposals.length} proposals side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Criteria</TableHead>
                      {proposals.map((proposal) => (
                        <TableHead key={proposal._id} className="min-w-[200px]">
                          <div className="space-y-1">
                            <div className="font-semibold">{proposal.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {proposal.developerInfo.companyName}
                            </div>
                            {proposal.status === 'shortlisted' && (
                              <Badge variant="secondary" className="mt-1">Shortlisted</Badge>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Corpus Amount */}
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Corpus Amount
                        </div>
                      </TableCell>
                      {proposals.map((proposal) => (
                        <TableCell key={proposal._id}>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(proposal.corpusAmount)}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Rent Amount */}
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Monthly Rent
                        </div>
                      </TableCell>
                      {proposals.map((proposal) => (
                        <TableCell key={proposal._id}>
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(proposal.rentAmount)}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* FSI */}
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          FSI
                        </div>
                      </TableCell>
                      {proposals.map((proposal) => (
                        <TableCell key={proposal._id}>{proposal.fsi}</TableCell>
                      ))}
                    </TableRow>

                    {/* Timeline */}
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Timeline
                        </div>
                      </TableCell>
                      {proposals.map((proposal) => (
                        <TableCell key={proposal._id}>
                          <div>{getTimelineDuration(proposal)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {proposal.proposedTimeline.phases.length} phases
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Experience */}
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Experience
                        </div>
                      </TableCell>
                      {proposals.map((proposal) => (
                        <TableCell key={proposal._id}>
                          <div>{proposal.developerInfo.experience} years</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {proposal.developerInfo.completedProjects} projects
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Amenities */}
                    <TableRow>
                      <TableCell className="font-medium">Amenities</TableCell>
                      {proposals.map((proposal) => (
                        <TableCell key={proposal._id}>
                          <div className="text-sm">
                            {proposal.proposedAmenities.length} amenities
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>


                    {/* Voting Results */}
                    {proposals.some(p => p.votingResults) && (
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Approval Rate
                          </div>
                        </TableCell>
                        {proposals.map((proposal) => (
                          <TableCell key={proposal._id}>
                            {proposal.votingResults ? (
                              <div className="space-y-2">
                                <div className="font-semibold text-lg text-primary">
                                  {proposal.votingResults.approvalPercentage}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {proposal.votingResults.totalVotes} votes
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No votes yet</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Voting Tab */}
        <TabsContent value="voting" className="space-y-4">
          <VotingPanel
            projectId={projectId}
            session="developer_selection"
            userRole={userRole}
            votingDeadline={votingDeadline}
            isVotingOpen={isVotingOpen}
            votingSubject="Developer Selection"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


