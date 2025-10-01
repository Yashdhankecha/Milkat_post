import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Building2,
  IndianRupee,
  Calendar,
  FileText,
  Users
} from 'lucide-react';

interface Proposal {
  _id: string;
  title: string;
  description: string;
  developer: {
    _id: string;
    name?: string;
  };
  developerProfile?: {
    company_name?: string;
  };
  corpusAmount: number;
  rentAmount: number;
  timeline: string;
  fsi: number;
}

interface SimpleVotingPanelProps {
  projectId: string;
  session: string;
  userRole: 'society_owner' | 'society_member';
  votingDeadline?: string;
  isVotingOpen?: boolean;
  projectTitle?: string;
  projectDescription?: string;
  projectDetails?: any;
}

export default function SimpleVotingPanel({ 
  projectId, 
  session, 
  userRole, 
  votingDeadline,
  isVotingOpen = true,
  projectTitle,
  projectDescription,
  projectDetails
}: SimpleVotingPanelProps) {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDeveloperSelection = async () => {
    if (!selectedDeveloper) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a developer.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.submitMemberVote({
        redevelopmentProject: projectId,
        votingSession: session,
        vote: 'yes', // Since they're selecting a developer, it's a positive vote
        reason: reason.trim() || undefined,
        selectedDeveloper: selectedDeveloper
      });

      toast({
        title: 'Developer Selection Registered Successfully!',
        description: `Your selection has been recorded.`,
      });

      // Reset form
      setSelectedDeveloper('');
      setReason('');
    } catch (error: any) {
      console.error('Error submitting selection:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to register selection. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
      <Card>
        <CardContent className="p-6 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Proposals Available</h3>
          <p className="text-muted-foreground">
            There are no proposals to vote on at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Redevelopment Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">{projectTitle}</h3>
            {projectDescription && (
              <p className="text-blue-700 mt-2">{projectDescription}</p>
            )}
          </div>
          
          {projectDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectDetails.estimatedBudget && (
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-blue-600">Estimated Budget</p>
                    <p className="font-semibold text-blue-800">{formatCurrency(projectDetails.estimatedBudget)}</p>
                  </div>
                </div>
              )}
              {projectDetails.expectedAmenities && projectDetails.expectedAmenities.length > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-blue-600">Expected Amenities</p>
                    <p className="font-semibold text-blue-800">{projectDetails.expectedAmenities.join(', ')}</p>
                  </div>
                </div>
              )}
              {projectDetails.timeline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-blue-600">Project Timeline</p>
                    <p className="font-semibold text-blue-800">{projectDetails.timeline}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Developer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Your Preferred Developer
          </CardTitle>
          <p className="text-muted-foreground">
            Choose from the developers who have submitted proposals for this project
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {proposals.length > 0 ? (
            <>
              {/* Developer Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Available Developers ({proposals.length}):
                </Label>
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <div 
                      key={proposal._id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDeveloper === proposal._id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDeveloper(proposal._id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="developer"
                          value={proposal._id}
                          checked={selectedDeveloper === proposal._id}
                          onChange={() => setSelectedDeveloper(proposal._id)}
                          className="h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {proposal.developerProfile?.company_name || proposal.developer.name || 'Developer'}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">{proposal.title}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-4 w-4" />
                              Corpus: {formatCurrency(proposal.corpusAmount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Timeline: {proposal.timeline}
                            </span>
                            <span>FSI: {proposal.fsi}</span>
                          </div>
                          {proposal.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {proposal.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason Box */}
              <div>
                <Label htmlFor="reason" className="text-base font-semibold mb-2 block">
                  Reason for your selection (Optional):
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you selected this developer..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleDeveloperSelection}
                disabled={!selectedDeveloper || isSubmitting}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isSubmitting ? 'Registering Selection...' : 'Register My Selection'}
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Developer Proposals</h3>
              <p className="text-muted-foreground">
                No developers have submitted proposals for this project yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
