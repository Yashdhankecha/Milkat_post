import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
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
  DollarSign,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Star,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import RedevelopmentForm from './RedevelopmentForm';
import ProposalComparison from './ProposalComparison';
import RedevelopmentVotingSystem from './RedevelopmentVotingSystem';
import ProjectTimeline from './ProjectTimeline';
import DocumentVault from './DocumentVault';
import MemberQueries from './MemberQueries';
// New enhanced components
import VotingPanel from './VotingPanel';
import SimpleVotingPanel from './SimpleVotingPanel';
import ProposalVotingComparison from './ProposalVotingComparison';
import RedevelopmentDocumentVault from './RedevelopmentDocumentVault';

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

interface RedevelopmentModuleProps {
  societyId?: string;
  isOwner?: boolean;
}

const RedevelopmentModule: React.FC<RedevelopmentModuleProps> = ({ societyId, isOwner = false }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<RedevelopmentProject[]>([]);
  const [proposals, setProposals] = useState<DeveloperProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RedevelopmentProject | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjects();
  }, [societyId]);

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
      const response = await apiClient.getDeveloperProposals(`?project_id=${projectId}`);
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch developer proposals",
          variant: "destructive",
        });
        return;
      }

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

  const handleProjectSelect = (project: RedevelopmentProject) => {
    setSelectedProject(project);
    setActiveTab('overview');
    if (project.status === 'proposals_received' || project.status === 'voting' || project.status === 'developer_selected') {
      fetchProposals(project._id);
    }
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
            <Card 
              key={project._id} 
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
                  <Badge className={getStatusColor(project.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="flex-1" />
                        <span className="text-sm font-medium">{project.progress}%</span>
                      </div>
                    </div>
                    
                    {project.estimatedBudget && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Budget</div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">
                            ₹{project.estimatedBudget.toLocaleString()} Cr
                          </span>
                        </div>
                      </div>
                    )}
                    
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Details Modal/Tabs */}
      {selectedProject && (
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="voting">Voting</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="queries">Queries</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ProjectOverview project={selectedProject} />
            </TabsContent>

            <TabsContent value="proposals" className="space-y-6">
              <ProposalComparison 
                project={selectedProject} 
                proposals={proposals}
                onProposalSelect={(proposal) => {
                  // Handle proposal selection logic
                  console.log('Selected proposal:', proposal);
                }}
              />
            </TabsContent>

            <TabsContent value="voting" className="space-y-6">

              {/* Society Owner Controls */}
              {isOwner && selectedProject.status !== 'voting' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Enable Voting</CardTitle>
                    <CardDescription>
                      Change the project status to "voting" to allow society members to vote on proposals.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={async () => {
                        try {
                          const updateData = {
                            status: 'voting',
                            votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
                          };
                          
                          const response = await apiClient.updateRedevelopmentProject(selectedProject._id, updateData);
                          
                          if (response.success || response.status === 'success') {
                            toast({
                              title: 'Voting Enabled',
                              description: 'Society members can now vote on proposals.',
                            });
                            fetchProjects(); // Refresh to get updated status
                          } else {
                            toast({
                              variant: 'destructive',
                              title: 'Error',
                              description: response.message || 'Failed to enable voting. Please try again.',
                            });
                          }
                        } catch (error) {
                          console.error('Error enabling voting:', error);
                          toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: error.message || 'Failed to enable voting. Please try again.',
                          });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Enable Voting (7 days)
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Simple Voting Interface */}
              {selectedProject.status === 'voting' && !isOwner ? (
                <SimpleVotingPanel
                  projectId={selectedProject._id}
                  session="developer_selection"
                  userRole="society_member"
                  votingDeadline={selectedProject.votingDeadline}
                  isVotingOpen={true}
                  projectTitle={selectedProject.title}
                  projectDescription={selectedProject.description}
                  projectDetails={{
                    estimatedBudget: selectedProject.estimatedBudget,
                    expectedAmenities: selectedProject.expectedAmenities,
                    timeline: selectedProject.timeline?.expectedCompletionDate
                  }}
                />
              ) : proposals.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Proposals Available</CardTitle>
                    <CardDescription>
                      {proposals.length} developer proposals have been submitted. 
                      {isOwner ? ' Enable voting to allow members to vote.' : ' Voting is not currently open.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {proposals.map((proposal) => (
                        <div key={proposal._id} className="p-4 border rounded-lg">
                          <h3 className="font-semibold">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {proposal.developerProfile?.company_name || proposal.developer.name || 'Developer'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Corpus: ₹{proposal.corpusAmount?.toLocaleString()}</span>
                            <span>Timeline: {proposal.timeline}</span>
                            <span>FSI: {proposal.fsi}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
                    <p className="text-muted-foreground">
                      No developer proposals have been submitted for this project.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <ProjectTimeline project={selectedProject} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              {/* Enhanced Document Vault */}
              <RedevelopmentDocumentVault
                projectId={selectedProject._id}
                userRole={isOwner ? 'society_owner' : 'society_member'}
                canUpload={isOwner}
                canDelete={isOwner}
              />
            </TabsContent>

            <TabsContent value="queries" className="space-y-6">
              <MemberQueries 
                project={selectedProject}
                onQueryResponse={(queryId, response) => {
                  // Handle query response
                  console.log('Query response:', queryId, response);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Create Project Form Modal */}
      {showCreateForm && (
        <RedevelopmentForm
          societyId={societyId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  );
};

// Project Overview Component
const ProjectOverview: React.FC<{ project: RedevelopmentProject }> = ({ project }) => {
  return (
    <div className="grid gap-6">
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.estimatedBudget && (
              <div>
                <h3 className="font-semibold mb-1">Estimated Budget</h3>
                <p className="text-2xl font-bold text-primary">
                  ₹{project.estimatedBudget.toLocaleString()} Cr
                </p>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-1">Progress</h3>
              <div className="flex items-center gap-2">
                <Progress value={project.progress} className="flex-1" />
                <span className="font-medium">{project.progress}%</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Created</h3>
              <p className="text-muted-foreground">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Last Updated</h3>
              <p className="text-muted-foreground">
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      {project.updates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.updates.slice(0, 3).map((update) => (
                <div key={update._id} className="border-l-4 border-primary pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{update.title}</h4>
                      <p className="text-muted-foreground text-sm mt-1">
                        {update.description}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(update.postedAt).toLocaleDateString()}
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
