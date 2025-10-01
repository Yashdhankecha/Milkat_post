import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { apiClient } from '../lib/api';
import { MessageSquare, Clock, CheckCircle, AlertCircle, ThumbsUp, Calendar, User } from 'lucide-react';

interface Query {
  _id: string;
  society?: {
    _id: string;
    name: string;
  };
  queryText: string;
  category: string;
  priority: string;
  status: string;
  response?: {
    text: string;
    respondedBy?: {
      _id: string;
      name: string;
    };
    respondedAt?: string;
  };
  upvotes?: Array<{
    member: string;
    votedAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface MemberQueriesListProps {
  societyId?: string;
  refreshTrigger?: number;
}

const MemberQueriesList: React.FC<MemberQueriesListProps> = ({ societyId, refreshTrigger }) => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (societyId) {
        params.societyId = societyId;
      }
      
      const response = await apiClient.getMyQueries(params);
      
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
  }, [societyId, refreshTrigger]);

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

  if (loading) {
    return (
      <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-100">
            <div className="p-2 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            My Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your queries...</p>
            </div>
          </div>
        </CardContent>
      </Card>
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

  if (queries.length === 0) {
    return (
      <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
        <CardContent className="p-8 text-center">
          <div className="p-3 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm w-fit mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No Queries Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            You haven't submitted any queries yet. Submit your first query to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-100">
            <div className="p-2 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            My Queries ({queries.length})
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track the status of your submitted queries and responses
          </p>
        </CardHeader>
      </Card>

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
                      {query.society?.name || 'Unknown Society'}
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
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Response</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                    {query.response.text}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <User className="h-3 w-3" />
                    <span>By {query.response.respondedBy?.name || 'Society Admin'}</span>
                    <Calendar className="h-3 w-3 ml-2" />
                    <span>{query.response.respondedAt ? formatDate(query.response.respondedAt) : 'Unknown'}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Submitted {query.createdAt ? formatDate(query.createdAt) : 'Unknown'}</span>
                  </div>
                  {query.upvotes && query.upvotes.length > 0 && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{query.upvotes.length} upvotes</span>
                    </div>
                  )}
                </div>
                
                {query.status === 'resolved' && (
                  <Badge className="px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MemberQueriesList;