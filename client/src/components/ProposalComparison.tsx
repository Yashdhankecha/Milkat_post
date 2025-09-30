import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  Star, 
  TrendingUp,
  Users,
  Award,
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
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

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
  proposedAmenities: Array<{
    name: string;
    description: string;
    category: string;
  }>;
  proposedTimeline: {
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
  const [selectedProposal, setSelectedProposal] = useState<DeveloperProposal | null>(null);
  const [loading, setLoading] = useState(false);

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
        title: "Success",
        description: "Developer proposal selected successfully",
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.ceil(diffDays / 30);
    return months;
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Shortlisted</p>
                <p className="text-2xl font-bold text-purple-600">
                  {proposals.filter(p => p.status === 'shortlisted').length}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
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
                    proposals.reduce((sum, p) => sum + p.corpusAmount, 0) / proposals.length
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Proposal Comparison
          </CardTitle>
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
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{proposal.developerInfo.companyName}</div>
                        <div className="text-sm text-muted-foreground">
                          {proposal.developerInfo.contactPerson}
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
                      {proposal.proposedTimeline.startDate && proposal.proposedTimeline.completionDate ? (
                        <div className="space-y-1">
                          <div className="font-medium">
                            {calculateDuration(
                              proposal.proposedTimeline.startDate,
                              proposal.proposedTimeline.completionDate
                            )} months
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(proposal.proposedTimeline.startDate)} - {formatDate(proposal.proposedTimeline.completionDate)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {proposal.evaluation?.overallScore ? (
                        <div className="space-y-1">
                          <div className={`font-medium ${getScoreColor(proposal.evaluation.overallScore)}`}>
                            {proposal.evaluation.overallScore}/100
                          </div>
                          <Progress 
                            value={proposal.evaluation.overallScore} 
                            className="w-16 h-2"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not evaluated</span>
                      )}
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
                          onClick={() => setSelectedProposal(proposal)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {proposal.status === 'shortlisted' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSelectProposal(proposal)}
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
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

      {/* Detailed Proposal View */}
      {selectedProposal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedProposal.title}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProposal(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Developer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Developer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedProposal.developerInfo.companyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProposal.developerInfo.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProposal.developerInfo.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProposal.developerInfo.contactEmail}</span>
                  </div>
                  {selectedProposal.developerInfo.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={selectedProposal.developerInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedProposal.developerInfo.website}
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProposal.developerInfo.experience} years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProposal.developerInfo.completedProjects} completed projects</span>
                  </div>
                  {selectedProposal.developerInfo.certifications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Certifications:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProposal.developerInfo.certifications.map((cert, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Proposal Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Proposal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Corpus Amount:</span>
                    <span>{formatCurrency(selectedProposal.corpusAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Rent Amount:</span>
                    <span>₹{selectedProposal.rentAmount.toLocaleString()}/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">FSI:</span>
                    <span>{selectedProposal.fsi}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Proposed Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedProposal.proposedAmenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedProposal.evaluation && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground">Evaluation Scores:</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Technical:</span>
                          <span className={getScoreColor(selectedProposal.evaluation.technicalScore)}>
                            {selectedProposal.evaluation.technicalScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Financial:</span>
                          <span className={getScoreColor(selectedProposal.evaluation.financialScore)}>
                            {selectedProposal.evaluation.financialScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Timeline:</span>
                          <span className={getScoreColor(selectedProposal.evaluation.timelineScore)}>
                            {selectedProposal.evaluation.timelineScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Overall:</span>
                          <span className={getScoreColor(selectedProposal.evaluation.overallScore)}>
                            {selectedProposal.evaluation.overallScore}/100
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground">{selectedProposal.description}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="default"
                onClick={() => handleSelectProposal(selectedProposal)}
                disabled={loading || selectedProposal.status !== 'shortlisted'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Select This Proposal
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProposalComparison;
