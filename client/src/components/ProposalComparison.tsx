import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Building2, 
  Calendar, 
  Star, 
  TrendingUp,
  Users,
  CheckCircle,
  X,
  Eye,
  Download,
  Phone,
  Mail,
  ExternalLink,
  BarChart3,
  Target,
  Clock,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface DeveloperProposal {
  _id: string;
  title: string;
  description: string;
  developer: {
    _id: string;
    phone: string;
    name?: string;
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

interface ProposalComparisonProps {
  project: any;
  proposals: DeveloperProposal[];
  onProposalSelect: (proposal: DeveloperProposal) => void;
}

const ProposalComparison: React.FC<ProposalComparisonProps> = ({
  project,
  proposals,
  onProposalSelect
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<DeveloperProposal | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [votingState, setVotingState] = useState<Record<string, { vote: 'yes' | 'no' | null; reason: string }>>({});

  const handleSelectProposal = async (proposal: DeveloperProposal) => {
    setLoading(true);
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
        title: "Proposal Selected",
        description: `${proposal.developerInfo.companyName} has been selected for this project.`,
      });
      
      onProposalSelect(proposal);
    } catch (error: any) {
      console.error('Error selecting proposal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to select proposal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleViewProposal = (proposal: DeveloperProposal) => {
    setSelectedProposal(proposal);
    setIsViewModalOpen(true);
  };

  const handleVote = (proposalId: string, vote: 'yes' | 'no', reason: string) => {
    setVotingState(prev => ({
      ...prev,
      [proposalId]: { vote, reason }
    }));
    
    // Here you can add API call to save the vote
    console.log(`Vote recorded for proposal ${proposalId}:`, { vote, reason });
    
    toast({
      title: "Vote Recorded",
      description: `Your ${vote} vote has been recorded for this proposal.`,
    });
  };

  const handleReasonChange = (proposalId: string, reason: string) => {
    setVotingState(prev => ({
      ...prev,
      [proposalId]: { ...prev[proposalId], reason }
    }));
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) {
      return '₹0';
    }
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return null;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = Math.ceil(diffDays / 30);
      return months;
    } catch (error) {
      return null;
    }
  };

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
          <p className="text-muted-foreground">
            Developer proposals will appear here once they submit their bids for this project.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
                <p className="text-2xl font-bold">{proposals.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-green-600">
                  {proposals.filter(p => p.status === 'selected').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Corpus</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    proposals.reduce((sum, p) => sum + (p.corpusAmount || 0), 0) / proposals.length
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Range: {formatCurrency(Math.min(...proposals.map(p => p.corpusAmount || 0)))} - {formatCurrency(Math.max(...proposals.map(p => p.corpusAmount || 0)))}
                </p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">₹</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Proposal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Proposal Comparison
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare developer proposals side by side. Use the actions to shortlist or select proposals.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead>Corpus</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>FSI</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {proposal.developerInfo?.companyName || proposal.developer?.name || 'Developer'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {proposal.developerInfo?.contactPerson || proposal.developer?.phone || 'Contact info not available'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {proposal.developerInfo?.experience ? `${proposal.developerInfo.experience} years exp` : ''}
                          {proposal.developerInfo?.completedProjects ? ` • ${proposal.developerInfo.completedProjects} projects` : ''}
                          {!proposal.developerInfo?.experience && !proposal.developerInfo?.completedProjects ? 'Experience not specified' : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(proposal.corpusAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{proposal.rentAmount.toLocaleString()}/month
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{proposal.fsi}</div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        // First check if we have complex proposedTimeline with dates
                        if (proposal.proposedTimeline?.startDate && proposal.proposedTimeline?.completionDate) {
                          const duration = calculateDuration(
                            proposal.proposedTimeline.startDate,
                            proposal.proposedTimeline.completionDate
                          );
                          
                          if (duration !== null) {
                            return (
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {duration} months
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(proposal.proposedTimeline.startDate)} - {formatDate(proposal.proposedTimeline.completionDate)}
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        // Fall back to simple timeline string (e.g., "21 months")
                        if (proposal.timeline) {
                          const timelineText = proposal.timeline.toLowerCase().includes('month') 
                            ? proposal.timeline 
                            : `${proposal.timeline} months`;
                          
                          return (
                            <div className="space-y-1">
                              <div className="font-medium">
                                {timelineText}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Simple timeline
                              </div>
                            </div>
                          );
                        }
                        
                        // No timeline data available
                        return (
                          <div className="space-y-1">
                            <div className="font-medium text-muted-foreground">
                              Not specified
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Missing timeline data
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProposal(proposal)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {proposal.status === 'selected' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Voting Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Vote on Proposals
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select your preferred proposal and provide your reason for the vote.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal._id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Proposal Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {proposal.developerInfo?.companyName || proposal.developer?.name || 'Developer'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">{proposal.title}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Corpus:</span>
                          <p className="font-medium">{formatCurrency(proposal.corpusAmount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p className="font-medium">
                            {proposal.timeline?.toLowerCase().includes('month') 
                              ? proposal.timeline 
                              : `${proposal.timeline} months`}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">FSI:</span>
                          <p className="font-medium">{proposal.fsi}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(proposal.status)}>
                            {proposal.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Voting Interface */}
                    <div className="flex-shrink-0 min-w-[300px]">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Button
                            variant={votingState[proposal._id]?.vote === 'yes' ? 'default' : 'outline'}
                            onClick={() => handleVote(proposal._id, 'yes', votingState[proposal._id]?.reason || '')}
                            className={`flex-1 ${
                              votingState[proposal._id]?.vote === 'yes' 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            ✓ Yes
                          </Button>
                          <Button
                            variant={votingState[proposal._id]?.vote === 'no' ? 'default' : 'outline'}
                            onClick={() => handleVote(proposal._id, 'no', votingState[proposal._id]?.reason || '')}
                            className={`flex-1 ${
                              votingState[proposal._id]?.vote === 'no' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            ✗ No
                          </Button>
                        </div>
                        
                        <textarea
                          placeholder="Enter your reason for this vote (optional)"
                          value={votingState[proposal._id]?.reason || ''}
                          onChange={(e) => handleReasonChange(proposal._id, e.target.value)}
                          className="w-full p-3 border rounded-md resize-none h-20 text-sm"
                          maxLength={500}
                        />
                        
                        {votingState[proposal._id]?.vote && (
                          <div className="text-sm text-muted-foreground">
                            Your vote: <span className="font-medium">{votingState[proposal._id].vote.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proposal Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proposal Details - {selectedProposal?.developerInfo?.companyName || selectedProposal?.developer?.name || 'Developer'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">{selectedProposal.title}</h4>
                      <p className="text-muted-foreground mt-1">{selectedProposal.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Corpus Amount</span>
                        <p className="font-semibold">{formatCurrency(selectedProposal.corpusAmount)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Rent Amount</span>
                        <p className="font-semibold">₹{selectedProposal.rentAmount?.toLocaleString()}/month</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">FSI</span>
                        <p className="font-semibold">{selectedProposal.fsi}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className={getStatusColor(selectedProposal.status)}>
                          {selectedProposal.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Developer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">
                        {selectedProposal.developerInfo?.companyName || selectedProposal.developer?.name || 'Developer'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedProposal.developerInfo?.contactPerson || selectedProposal.developer?.phone || 'Contact info not available'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Experience</span>
                        <p className="font-semibold">{selectedProposal.developerInfo.experience} years</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Completed Projects</span>
                        <p className="font-semibold">{selectedProposal.developerInfo.completedProjects}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Contact</span>
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedProposal.developerInfo.contactPhone}
                          </p>
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedProposal.developerInfo.contactEmail}
                          </p>
                        </div>
                      </div>
                      {selectedProposal.developerInfo.website && (
                        <div>
                          <span className="text-sm text-muted-foreground">Website</span>
                          <a 
                            href={selectedProposal.developerInfo.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                    {selectedProposal.developerInfo.certifications && selectedProposal.developerInfo.certifications.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Certifications</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedProposal.developerInfo.certifications.map((cert, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              {(selectedProposal.proposedTimeline || selectedProposal.timeline) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Project Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProposal.proposedTimeline?.startDate && selectedProposal.proposedTimeline?.completionDate ? (
                      // Complex timeline with dates and phases
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Start Date</span>
                            <p className="font-semibold">{formatDate(selectedProposal.proposedTimeline.startDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Completion Date</span>
                            <p className="font-semibold">{formatDate(selectedProposal.proposedTimeline.completionDate)}</p>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-sm text-muted-foreground">Total Duration</span>
                            <p className="font-semibold">
                              {(() => {
                                const duration = calculateDuration(
                                  selectedProposal.proposedTimeline.startDate,
                                  selectedProposal.proposedTimeline.completionDate
                                );
                                return duration ? `${duration} months` : 'Not specified';
                              })()}
                            </p>
                          </div>
                        </div>
                        {selectedProposal.proposedTimeline.phases && selectedProposal.proposedTimeline.phases.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-semibold mb-3">Project Phases</h5>
                            <div className="space-y-3">
                              {selectedProposal.proposedTimeline.phases.map((phase, index) => (
                                <div key={index} className="border rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h6 className="font-medium">{phase.name}</h6>
                                      <p className="text-sm text-muted-foreground">{phase.description}</p>
                                    </div>
                                    <Badge variant="outline">{phase.duration} months</Badge>
                                  </div>
                                  {phase.milestones && phase.milestones.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-xs text-muted-foreground">Milestones:</span>
                                      <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                                        {phase.milestones.map((milestone, milestoneIndex) => (
                                          <li key={milestoneIndex}>{milestone}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      // Simple timeline string
                      <div className="text-center py-4">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {selectedProposal.timeline.toLowerCase().includes('month') 
                            ? selectedProposal.timeline 
                            : `${selectedProposal.timeline} months`}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Simple timeline provided by developer
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {selectedProposal.proposedAmenities && selectedProposal.proposedAmenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Proposed Amenities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProposal.proposedAmenities.map((amenity, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <h6 className="font-medium">{amenity.name}</h6>
                          <p className="text-sm text-muted-foreground">{amenity.description}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {amenity.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evaluation */}
              {selectedProposal.evaluation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Evaluation Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedProposal.evaluation.technicalScore}</p>
                        <p className="text-sm text-muted-foreground">Technical Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{selectedProposal.evaluation.financialScore}</p>
                        <p className="text-sm text-muted-foreground">Financial Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{selectedProposal.evaluation.timelineScore}</p>
                        <p className="text-sm text-muted-foreground">Timeline Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{selectedProposal.evaluation.overallScore}</p>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                    </div>
                    {selectedProposal.evaluation.comments && (
                      <div className="mt-4">
                        <span className="text-sm text-muted-foreground">Comments</span>
                        <p className="mt-1 text-sm">{selectedProposal.evaluation.comments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalComparison;