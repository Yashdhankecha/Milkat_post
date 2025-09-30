import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Reply, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Query {
  _id: string;
  title: string;
  description: string;
  raisedBy: string;
  raisedAt: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

interface MemberQueriesProps {
  project: {
    _id: string;
    title: string;
    queries: Query[];
  };
  onQueryResponse?: (queryId: string, response: string) => void;
  onQuerySubmit?: (query: { title: string; description: string }) => void;
  canRespond?: boolean;
  canSubmit?: boolean;
}

const MemberQueries: React.FC<MemberQueriesProps> = ({
  project,
  onQueryResponse,
  onQuerySubmit,
  canRespond = false,
  canSubmit = true
}) => {
  const [showNewQuery, setShowNewQuery] = useState(false);
  const [showResponse, setShowResponse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form states
  const [newQuery, setNewQuery] = useState({ title: '', description: '' });
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      open: 'bg-red-100 text-red-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, React.ReactNode> = {
      open: <AlertCircle className="h-4 w-4" />,
      in_review: <Clock className="h-4 w-4" />,
      resolved: <CheckCircle className="h-4 w-4" />,
      closed: <CheckCircle className="h-4 w-4" />,
    };
    return statusIcons[status] || <Clock className="h-4 w-4" />;
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

  const filteredQueries = project.queries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || query.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuery.title.trim() || !newQuery.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      onQuerySubmit?.(newQuery);
      
      toast({
        title: "Success",
        description: "Query submitted successfully",
      });
      
      setNewQuery({ title: '', description: '' });
      setShowNewQuery(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit query",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (queryId: string) => {
    if (!responseText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a response",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      onQueryResponse?.(queryId, responseText);
      
      toast({
        title: "Success",
        description: "Response submitted successfully",
      });
      
      setResponseText('');
      setShowResponse(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: project.queries.length,
      open: project.queries.filter(q => q.status === 'open').length,
      in_review: project.queries.filter(q => q.status === 'in_review').length,
      resolved: project.queries.filter(q => q.status === 'resolved').length,
      closed: project.queries.filter(q => q.status === 'closed').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Member Queries & Complaints</h2>
          <p className="text-muted-foreground">
            Address member concerns and questions about the project
          </p>
        </div>
        {canSubmit && (
          <Button onClick={() => setShowNewQuery(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Raise Query
          </Button>
        )}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.in_review}</div>
            <div className="text-sm text-muted-foreground">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{statusCounts.closed}</div>
            <div className="text-sm text-muted-foreground">Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search queries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {Object.entries({
                all: 'All',
                open: 'Open',
                in_review: 'In Review',
                resolved: 'Resolved',
                closed: 'Closed'
              }).map(([key, label]) => (
                <Button
                  key={key}
                  variant={filterStatus === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queries List */}
      {filteredQueries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Queries Found</h3>
            <p className="text-muted-foreground">
              {project.queries.length === 0 
                ? "No queries or complaints have been raised yet."
                : "No queries match your search criteria."
              }
            </p>
            {canSubmit && project.queries.length === 0 && (
              <Button 
                onClick={() => setShowNewQuery(true)} 
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Raise First Query
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((query) => (
            <Card key={query._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold">{query.title}</h4>
                      <Badge className={getStatusColor(query.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(query.status)}
                          {query.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{query.description}</p>
                  </div>
                  {canRespond && query.status !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResponse(query._id)}
                      className="gap-2"
                    >
                      <Reply className="h-4 w-4" />
                      Respond
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Raised by {query.raisedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(query.raisedAt)}</span>
                    </div>
                  </div>
                  
                  {query.response && (
                    <div className="border-l-4 border-primary pl-4 bg-muted/50 p-4 rounded-r-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-4 w-4 text-primary" />
                        <span className="font-medium">Official Response</span>
                      </div>
                      <p className="text-muted-foreground">{query.response}</p>
                      {query.respondedBy && query.respondedAt && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>By {query.respondedBy}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(query.respondedAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Query Form */}
      {showNewQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Raise New Query</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitQuery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="queryTitle">Query Title</Label>
                <Input
                  id="queryTitle"
                  value={newQuery.title}
                  onChange={(e) => setNewQuery(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a brief title for your query"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="queryDescription">Description</Label>
                <Textarea
                  id="queryDescription"
                  value={newQuery.description}
                  onChange={(e) => setNewQuery(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your query or concern in detail"
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Query
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewQuery(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Response Form */}
      {showResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Respond to Query</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmitResponse(showResponse);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="responseText">Response</Label>
                <Textarea
                  id="responseText"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the query"
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Responding...
                    </>
                  ) : (
                    <>
                      <Reply className="h-4 w-4" />
                      Submit Response
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowResponse(null);
                    setResponseText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberQueries;
