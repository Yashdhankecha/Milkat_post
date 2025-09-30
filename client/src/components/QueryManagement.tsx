import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { apiClient } from '../lib/api';
import { MessageSquare, Clock, CheckCircle, AlertCircle, ThumbsUp, Calendar, User, Send, Filter } from 'lucide-react';

interface Query {
  _id: string;
  member: {
    _id: string;
    phone: string;
    name?: string;
  };
  memberProfile: {
    _id: string;
    fullName: string;
  };
  queryText: string;
  category: string;
  priority: string;
  status: string;
  response?: {
    text: string;
    respondedBy: {
      _id: string;
      name: string;
    };
    respondedAt: string;
  };
  upvotes: Array<{
    member: string;
    votedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface QueryManagementProps {
  societyId: string;
  refreshTrigger?: number;
}

const QueryManagement: React.FC<QueryManagementProps> = ({ societyId, refreshTrigger }) => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  });
  const { toast } = useToast();

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.priority !== 'all') params.priority = filters.priority;
      
      const response = await apiClient.getSocietyQueries(societyId, params);
      
      if (response.error) {
        setError(response.error);
      } else {
        setQueries(response.data?.queries || []);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
      setError('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [societyId, refreshTrigger, filters]);

  const handleRespond = async () => {
    if (!selectedQuery || !responseText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response",
        variant: "destructive",
      });
      return;
    }

    setIsResponding(true);

    try {
      const response = await apiClient.respondToQuery(selectedQuery._id, responseText.trim());

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Response sent successfully",
        });
        
        setResponseText('');
        setSelectedQuery(null);
        fetchQueries(); // Refresh the list
      }
    } catch (error) {
      console.error('Error responding to query:', error);
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleStatusUpdate = async (queryId: string, newStatus: string) => {
    try {
      const response = await apiClient.updateQueryStatus(queryId, newStatus);

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Query status updated successfully",
        });
        fetchQueries(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating query status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return '🔧';
      case 'amenities':
        return '🏊';
      case 'security':
        return '🔒';
      case 'billing':
        return '💰';
      case 'complaint':
        return '⚠️';
      case 'suggestion':
        return '💡';
      default:
        return '💬';
    }
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

  const openQueries = queries.filter(q => q.status === 'open').length;
  const inProgressQueries = queries.filter(q => q.status === 'in_progress').length;
  const resolvedQueries = queries.filter(q => q.status === 'resolved').length;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-blue-500/5 dark:from-gray-900/10 dark:to-blue-900/10 opacity-70 blur-3xl pointer-events-none"></div>
              <CardContent className="p-4 relative">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Queries */}
        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading member queries...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="relative overflow-hidden rounded-xl shadow-lg border border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 dark:from-red-900/20 dark:to-pink-900/20 opacity-70 blur-3xl pointer-events-none"></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Error Loading Queries</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Open Queries</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{openQueries}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-900/20 dark:to-orange-900/20 opacity-70 blur-3xl pointer-events-none"></div>
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{inProgressQueries}</p>
              </div>
              <div className="p-2 rounded-full bg-yellow-500/20 dark:bg-yellow-700/30 backdrop-blur-sm">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-900/20 dark:to-emerald-900/20 opacity-70 blur-3xl pointer-events-none"></div>
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Resolved</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{resolvedQueries}</p>
              </div>
              <div className="p-2 rounded-full bg-green-500/20 dark:bg-green-700/30 backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-blue-500/5 dark:from-gray-900/10 dark:to-blue-900/10 opacity-70 blur-3xl pointer-events-none"></div>
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Queries List */}
      {queries.length === 0 ? (
        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
          <CardContent className="p-8 text-center">
            <div className="p-3 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm w-fit mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No Queries Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No member queries match your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => (
            <Card key={query._id} className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-blue-500/5 dark:from-gray-900/10 dark:to-blue-900/10 opacity-70 blur-3xl pointer-events-none"></div>
              
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(query.category)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                        {query.category.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        By {query.memberProfile?.fullName || query.member.name || query.member.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                      {query.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                      {query.priority}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {query.queryText}
                  </p>
                </div>

                {query.response && (
                  <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Your Response</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      {query.response.text}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(query.response.respondedAt)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Submitted {formatDate(query.createdAt)}</span>
                    </div>
                    {query.upvotes.length > 0 && (
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{query.upvotes.length} upvotes</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {query.status !== 'resolved' && query.status !== 'closed' && (
                      <Select value={query.status} onValueChange={(value) => handleStatusUpdate(query._id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {!query.response && (
                      <Button
                        onClick={() => setSelectedQuery(query)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedQuery && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="relative overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-100">
                <div className="p-2 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Respond to Query
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Respond to {selectedQuery.memberProfile?.fullName || selectedQuery.member.name || selectedQuery.member.phone}'s query
              </p>
            </CardHeader>

            <CardContent className="relative space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Original Query:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuery.queryText}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseText" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Response *
                </Label>
                <Textarea
                  id="responseText"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the member's query..."
                  className="min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleRespond}
                  disabled={isResponding || !responseText.trim()}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                >
                  {isResponding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    setSelectedQuery(null);
                    setResponseText('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </Card>
      )}
    </div>
  );
};

export default QueryManagement;