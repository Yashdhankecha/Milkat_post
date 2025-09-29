import React, { useState, useRef } from 'react';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X, Eye, Download, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export interface DocumentFile {
  file?: File;
  url?: string;
  mediaId?: string;
  name: string;
  size?: number;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

interface DocumentUploadSectionProps {
  title: string;
  description: string;
  bucketName: string;
  folderPath: string;
  documents: DocumentFile[];
  onDocumentsChange: (documents: DocumentFile[]) => void;
  acceptedTypes?: string;
  maxSizeMessage?: string;
  className?: string;
  uploadButtonColor?: 'primary' | 'orange' | 'blue';
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  title,
  description,
  bucketName,
  folderPath,
  documents,
  onDocumentsChange,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSizeMessage = "PDF, DOC, DOCX, JPG, PNG files up to 10MB each",
  className = "",
  uploadButtonColor = 'primary'
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const colorClasses = {
    primary: {
      border: 'border-primary/25 hover:border-primary/40',
      bg: 'from-primary/5',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      textColor: 'text-primary hover:text-primary/80'
    },
    orange: {
      border: 'border-orange-200 hover:border-orange-300',
      bg: 'from-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700 hover:text-orange-600'
    },
    blue: {
      border: 'border-blue-200 hover:border-blue-300',
      bg: 'from-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700 hover:text-blue-600'
    }
  };

  const colors = colorClasses[uploadButtonColor];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newDocuments: DocumentFile[] = selectedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      uploadProgress: 0
    }));

    onDocumentsChange([...documents, ...newDocuments]);
    
    // Start uploading immediately
    newDocuments.forEach((doc, index) => {
      if (doc.file) {
        uploadFile(doc, documents.length + index);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (document: DocumentFile, index: number) => {
    if (!document.file) return;

    // Update status to uploading
    updateDocumentStatus(index, 'uploading', 0);

    try {
      // Use our API client's upload method
      const { data, error: uploadError } = await apiClient.uploadSingleFile(document.file);

      if (uploadError) throw uploadError;

      // Update document with completed status
      const updatedDocuments = [...documents];
      updatedDocuments[index] = {
        ...document,
        url: data.media.url,
        mediaId: data.media.id,
        status: 'completed',
        uploadProgress: 100
      };
      onDocumentsChange(updatedDocuments);

      toast({
        title: "Upload Successful",
        description: `${document.name} has been uploaded successfully.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      updateDocumentStatus(index, 'error', 0, 'Upload failed. Please try again.');
      
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${document.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const updateDocumentStatus = (index: number, status: DocumentFile['status'], progress?: number, errorMessage?: string) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index] = {
      ...updatedDocuments[index],
      status,
      uploadProgress: progress !== undefined ? progress : updatedDocuments[index].uploadProgress,
      errorMessage
    };
    onDocumentsChange(updatedDocuments);
  };

  const removeDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);
    onDocumentsChange(updatedDocuments);
  };

  const deleteUploadedDocument = async (index: number) => {
    const document = documents[index];
    if (!document.url) return;

    try {
      // Use our API client's delete method if we have a mediaId
      if (document.mediaId) {
        const { error } = await apiClient.deleteMedia(document.mediaId);
        if (error) throw error;
      }

      removeDocument(index);

      toast({
        title: "Document Deleted",
        description: `${document.name} has been deleted successfully.`,
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: `Failed to delete ${document.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const downloadDocument = (document: DocumentFile) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const previewDocument = (document: DocumentFile) => {
    if (!document.url) return;
    
    const isImage = document.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
    if (isImage) {
      setPreviewUrl(document.url);
      setPreviewTitle(document.name);
    } else {
      // For PDFs and other documents, open in new tab
      window.open(document.url, '_blank');
    }
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: DocumentFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-background border-border';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Upload Area */}
      <div className={`border-2 border-dashed rounded-xl p-6 bg-gradient-to-br to-background transition-all ${colors.border} ${colors.bg}`}>
        <div className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${colors.iconBg}`}>
            <Upload className={`h-6 w-6 ${colors.iconColor}`} />
          </div>
          <div>
            <Label htmlFor={`upload-${folderPath}`} className="cursor-pointer">
              <span className={`text-sm font-semibold transition-colors ${colors.textColor}`}>
                {title}
              </span>
              <Input
                ref={fileInputRef}
                id={`upload-${folderPath}`}
                type="file"
                multiple
                accept={acceptedTypes}
                onChange={handleFileSelect}
                className="sr-only"
              />
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {maxSizeMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Documents ({documents.length})
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((document, index) => {
              const isImage = document.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
              const showPreview = isImage && (document.url || document.file);
              const previewSrc = document.url || (document.file ? URL.createObjectURL(document.file) : '');

              return (
                <div key={index} className={`relative group border rounded-lg overflow-hidden ${getStatusColor(document.status)}`}>
                  {/* Preview Area */}
                  <div className="aspect-square">
                    {showPreview ? (
                      <img 
                        src={previewSrc} 
                        alt={document.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Status Overlay */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {document.status === 'completed' && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => previewDocument(document)}
                              className="w-8 h-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => downloadDocument(document)}
                              className="w-8 h-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        
                        {document.status === 'completed' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="w-8 h-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{document.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUploadedDocument(index)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeDocument(index)}
                            className="w-8 h-8 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(document.status)}
                      <p className="text-xs font-medium truncate flex-1">{document.name}</p>
                    </div>
                    
                    {document.size && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {(document.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                    
                    {document.status === 'uploading' && (
                      <div className="space-y-1">
                        <Progress value={document.uploadProgress || 0} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Uploading... {document.uploadProgress || 0}%
                        </p>
                      </div>
                    )}
                    
                    {document.status === 'error' && (
                      <p className="text-xs text-red-600">
                        {document.errorMessage || 'Upload failed'}
                      </p>
                    )}
                    
                    {document.status === 'completed' && (
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4">
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt={previewTitle}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};