import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  Lock,
  Unlock,
  Calendar,
  User,
  File,
  Image,
  FileImage,
  FileVideo,
  Archive,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Document {
  _id: string;
  name: string;
  type: 'tender_notice' | 'agm_minutes' | 'agreement' | 'approval' | 'design' | 'legal' | 'other';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  isPublic: boolean;
}

interface DocumentVaultProps {
  project: {
    _id: string;
    title: string;
    documents: Document[];
  };
  onDocumentUpload?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  canEdit?: boolean;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({
  project,
  onDocumentUpload,
  onDocumentDelete,
  canEdit = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const documentTypes = {
    tender_notice: 'Tender Notice',
    agm_minutes: 'AGM Minutes',
    agreement: 'Agreement',
    approval: 'Approval',
    design: 'Design',
    legal: 'Legal',
    other: 'Other'
  };

  const getDocumentIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      tender_notice: <FileText className="h-5 w-5" />,
      agm_minutes: <FileText className="h-5 w-5" />,
      agreement: <FileText className="h-5 w-5" />,
      approval: <FileText className="h-5 w-5" />,
      design: <Image className="h-5 w-5" />,
      legal: <FileText className="h-5 w-5" />,
      other: <File className="h-5 w-5" />
    };
    return iconMap[type] || <File className="h-5 w-5" />;
  };

  const getDocumentTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      tender_notice: 'bg-blue-100 text-blue-800',
      agm_minutes: 'bg-green-100 text-green-800',
      agreement: 'bg-purple-100 text-purple-800',
      approval: 'bg-yellow-100 text-yellow-800',
      design: 'bg-pink-100 text-pink-800',
      legal: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredDocuments = project.documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      
      setShowUploadForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (document: Document) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (document: Document) => {
    window.open(document.url, '_blank');
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onDocumentDelete?.(documentId);
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Vault</h2>
          <p className="text-muted-foreground">
            Manage project documents, agreements, and approvals
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowUploadForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(documentTypes).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
            <p className="text-muted-foreground">
              {project.documents.length === 0 
                ? "No documents have been uploaded yet."
                : "No documents match your search criteria."
              }
            </p>
            {canEdit && project.documents.length === 0 && (
              <Button 
                onClick={() => setShowUploadForm(true)} 
                className="mt-4 gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload First Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getDocumentIcon(document.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{document.name}</h4>
                      <Badge className={getDocumentTypeColor(document.type)}>
                        {documentTypes[document.type]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {document.isPublic ? (
                      <Unlock className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded {formatDate(document.uploadedAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>By {document.uploadedBy}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(document)}
                      className="flex-1 gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="flex-1 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentName">Document Name</Label>
                <Input
                  id="documentName"
                  placeholder="Enter document name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentFile">Select File</Label>
                <Input
                  id="documentFile"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: PDF, DOC, XLS, Images, Videos (Max 10MB)
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  className="rounded"
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Make document public to all members
                </Label>
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" disabled={uploading} className="gap-2">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUploadForm(false)}
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

export default DocumentVault;
