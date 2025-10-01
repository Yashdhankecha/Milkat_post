import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import apiClient from '../lib/api';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Lock, 
  Unlock,
  Calendar,
  User,
  FolderOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Document {
  _id?: string;
  name: string;
  type: string;
  url: string;
  uploadedBy?: {
    _id: string;
    phone: string;
    profile?: {
      fullName: string;
    };
  };
  uploadedAt: string;
  isPublic: boolean;
  size?: number;
  mimeType?: string;
}

interface RedevelopmentDocumentVaultProps {
  projectId: string;
  userRole: 'society_owner' | 'society_member' | 'developer';
  canUpload?: boolean;
  canDelete?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'tender_notice', label: 'Tender Notice' },
  { value: 'agm_minutes', label: 'AGM Minutes' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'approval', label: 'Approval' },
  { value: 'design', label: 'Design' },
  { value: 'legal', label: 'Legal' },
  { value: 'financial', label: 'Financial' },
  { value: 'consent_letter', label: 'Consent Letter' },
  { value: 'mou', label: 'MoU' },
  { value: 'other', label: 'Other' }
];

export default function RedevelopmentDocumentVault({ 
  projectId, 
  userRole,
  canUpload = false,
  canDelete = false 
}: RedevelopmentDocumentVaultProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getRedevelopmentProject(projectId);
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load documents. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB.',
        });
        return;
      }
      setSelectedFile(file);
      setDocumentName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a file and document type.',
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', documentType);
      formData.append('name', documentName);
      formData.append('isPublic', isPublic.toString());

      // Upload file first
      const uploadResponse = await fetch(`${apiClient['baseURL']}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();

      // Add document to project
      await apiClient.request(`/redevelopment-projects/${projectId}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          name: documentName,
          type: documentType,
          url: uploadData.url,
          isPublic,
        }),
      });

      toast({
        title: 'Success',
        description: 'Document uploaded successfully.',
      });

      // Reset form and refresh
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentName('');
      setDocumentType('');
      setIsPublic(true);
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await apiClient.request(`/redevelopment-projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Success',
        description: 'Document deleted successfully.',
      });

      await fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete document. Please try again.',
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const filteredDocuments = filterType === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === filterType);

  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Document Vault
              </CardTitle>
              <CardDescription>
                Manage all project documents and agreements
              </CardDescription>
            </div>
            {canUpload && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Add a new document to the project vault
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="file">Select File</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                        className="mt-1"
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name">Document Name</Label>
                      <Input
                        id="name"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Enter document name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="type">Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isPublic" className="cursor-pointer">
                        Make document public (visible to all members)
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setUploadDialogOpen(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label>Filter by Type:</Label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No documents found. {canUpload && 'Upload your first document to get started.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([type, docs]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {getDocumentTypeLabel(type)}
                  <Badge variant="secondary">{docs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docs.map((doc, index) => (
                    <div
                      key={doc._id || index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{doc.name}</h4>
                            {doc.isPublic ? (
                              <Unlock className="h-3 w-3 text-green-600" title="Public" />
                            ) : (
                              <Lock className="h-3 w-3 text-orange-600" title="Private" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {doc.uploadedBy && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>
                                  {doc.uploadedBy.profile?.fullName || doc.uploadedBy.phone}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(doc.uploadedAt)}</span>
                            </div>
                            {doc.size && (
                              <span>{formatFileSize(doc.size)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="flex items-center gap-1"
                        >
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="flex items-center gap-1"
                        >
                          <a href={doc.url} download>
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        </Button>
                        {canDelete && doc._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc._id!)}
                            className="flex items-center gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

