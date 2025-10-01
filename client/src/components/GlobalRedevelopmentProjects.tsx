import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Calendar, DollarSign, Users, Eye, FileText, TrendingUp, Filter, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RedevelopmentProject {
  _id: string;
  title: string;
  description: string;
  status: string;
  estimatedBudget: number;
  corpusAmount: number;
  rentAmount: number;
  expectedCompletion?: string;
  society: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    totalFlats: number;
    amenities: string[];
    fsi?: number;
  };
  createdBy: {
    phone: string;
    name: string;
  };
  createdAt: string;
  hasProposal: boolean;
  proposalStatus?: string;
}

interface GlobalRedevelopmentProjectsProps {
  className?: string;
}

const GlobalRedevelopmentProjects: React.FC<GlobalRedevelopmentProjectsProps> = ({ className }) => {
  const [projects, setProjects] = useState<RedevelopmentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    state: '',
    minBudget: '',
    maxBudget: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RedevelopmentProject | null>(null);
  const [proposalData, setProposalData] = useState({
    title: '',
    description: '',
    corpusAmount: '',
    rentAmount: '',
    timeline: '',
    terms: ''
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async (pageNum = 1, resetFilters = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12'
      });

      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.city) params.append('city', filters.city);
      if (filters.state) params.append('state', filters.state);
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await apiClient.get(`/global-redevelopment/projects?${params}`);
      const newProjects = response?.data?.projects || [];
      
      if (pageNum === 1 || resetFilters) {
        setProjects(newProjects);
      } else {
        setProjects(prev => [...prev, ...newProjects]);
      }
      
      setHasMore(newProjects.length === 12);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch redevelopment projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProjects(nextPage);
  };

  const handleSubmitProposal = (project: RedevelopmentProject) => {
    setSelectedProject(project);
    setProposalData({
      title: `Proposal for ${project.title}`,
      description: '',
      corpusAmount: '',
      rentAmount: '',
      timeline: '',
      terms: ''
    });
    setShowProposalModal(true);
  };

  const handleProposalSubmit = async () => {
    if (!selectedProject) return;

    setSubmittingProposal(true);
    try {
      const proposalPayload = {
        title: proposalData.title,
        description: proposalData.description,
        corpusAmount: parseFloat(proposalData.corpusAmount) || 0,
        rentAmount: parseFloat(proposalData.rentAmount) || 0,
        timeline: proposalData.timeline,
        terms: proposalData.terms
      };

      await apiClient.post(`/global-redevelopment/projects/${selectedProject._id}/proposals`, proposalPayload);
      
      toast({
        title: "Proposal Submitted",
        description: "Your proposal has been submitted successfully!",
      });

      setShowProposalModal(false);
      setSelectedProject(null);
      setProposalData({
        title: '',
        description: '',
        corpusAmount: '',
        rentAmount: '',
        timeline: '',
        terms: ''
      });
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingProposal(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      planning: 'bg-blue-500/20 text-blue-800 border-blue-500',
      tender_open: 'bg-yellow-500/20 text-yellow-800 border-yellow-500',
      proposals_received: 'bg-purple-500/20 text-purple-800 border-purple-500',
      voting: 'bg-orange-500/20 text-orange-800 border-orange-500',
      developer_selected: 'bg-green-500/20 text-green-800 border-green-500',
      construction: 'bg-indigo-500/20 text-indigo-800 border-indigo-500',
      completed: 'bg-emerald-500/20 text-emerald-800 border-emerald-500',
      cancelled: 'bg-red-500/20 text-red-800 border-red-500'
    };
    return statusColors[status] || 'bg-gray-500/20 text-gray-800 border-gray-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && projects.length === 0) {
    return (
      <Card className={`rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-100">
            <Building2 className="h-5 w-5 text-blue-500" />
            Global Redevelopment Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-100">
            <Building2 className="h-5 w-5 text-blue-500" />
            Global Redevelopment Projects
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Discover redevelopment opportunities from societies across the platform
          </p>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
            <Filter className="h-4 w-4 text-blue-500" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Status
              </label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="tender_open">Tender Open</SelectItem>
                  <SelectItem value="proposals_received">Proposals Received</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                City
              </label>
              <Input
                placeholder="Enter city"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                State
              </label>
              <Input
                placeholder="Enter state"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Sort By
              </label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Min Budget (₹)
              </label>
              <Input
                type="number"
                placeholder="Minimum budget"
                value={filters.minBudget}
                onChange={(e) => handleFilterChange('minBudget', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Max Budget (₹)
              </label>
              <Input
                type="number"
                placeholder="Maximum budget"
                value={filters.maxBudget}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
          <CardContent className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No redevelopment projects match your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project._id} className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-2">
                    {project.title}
                  </CardTitle>
                  <Badge className={`border ${getStatusColor(project.status)} text-xs px-2 py-1 flex-shrink-0`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Society Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{project.society.name}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>{project.society.city}, {project.society.state}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {project.description}
                </p>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{formatCurrency(project.estimatedBudget)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{project.society.totalFlats} flats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>FSI: {project.society?.fsi || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span>{formatDate(project.expectedCompletion)}</span>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Requirements</h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div>Corpus: ₹{project.corpusAmount?.toLocaleString() || 'N/A'}</div>
                    <div>Rent: ₹{project.rentAmount?.toLocaleString() || 'N/A'}/month</div>
                    <div>Amenities: {project.society?.amenities?.slice(0, 2).join(', ') || 'N/A'}</div>
                  </div>
                </div>

                {/* Proposal Status */}
                {project.hasProposal && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Proposal Status:</strong> {project.proposalStatus}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('View Details clicked for project:', project._id);
                      navigate(`/project/${project._id}`);
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {!project.hasProposal && (
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log('Submit Proposal clicked for project:', project._id);
                        handleSubmitProposal(project);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Submit Proposal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8 py-2"
          >
            {loading ? 'Loading...' : 'Load More Projects'}
          </Button>
        </div>
      )}

      {/* Proposal Submission Modal */}
      {showProposalModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Submit Proposal</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProposalModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedProject.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedProject.society?.city}, {selectedProject.society?.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ₹{selectedProject.estimatedBudget?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="proposal-title">Proposal Title</Label>
                  <Input
                    id="proposal-title"
                    value={proposalData.title}
                    onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter proposal title"
                  />
                </div>

                <div>
                  <Label htmlFor="proposal-description">Description</Label>
                  <Textarea
                    id="proposal-description"
                    value={proposalData.description}
                    onChange={(e) => setProposalData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your proposal in detail..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="corpus-amount">Corpus Amount (₹)</Label>
                    <Input
                      id="corpus-amount"
                      type="number"
                      value={proposalData.corpusAmount}
                      onChange={(e) => setProposalData(prev => ({ ...prev, corpusAmount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rent-amount">Rent Amount (₹)</Label>
                    <Input
                      id="rent-amount"
                      type="number"
                      value={proposalData.rentAmount}
                      onChange={(e) => setProposalData(prev => ({ ...prev, rentAmount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    value={proposalData.timeline}
                    onChange={(e) => setProposalData(prev => ({ ...prev, timeline: e.target.value }))}
                    placeholder="e.g., 24 months"
                  />
                </div>

                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={proposalData.terms}
                    onChange={(e) => setProposalData(prev => ({ ...prev, terms: e.target.value }))}
                    placeholder="Enter any specific terms and conditions..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowProposalModal(false)}
                disabled={submittingProposal}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProposalSubmit}
                disabled={submittingProposal || !proposalData.title || !proposalData.description}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {submittingProposal ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalRedevelopmentProjects;
