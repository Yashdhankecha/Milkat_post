import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { FileText, ExternalLink, Download, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  name: string;
  children?: React.ReactNode;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, name, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleOpen = () => {
    console.log('Opening PDF:', url);
    setHasError(false);
    setIsOpen(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleIframeError = () => {
    console.error('Failed to load PDF in iframe:', url);
    setHasError(true);
  };

  return (
    <>
      {children ? (
        <div onClick={handleOpen} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="text-blue-600 hover:text-blue-700"
        >
          <FileText className="h-4 w-4 mr-1" />
          View PDF
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              {name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          <div className="h-[calc(90vh-200px)]">
            {hasError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load PDF in viewer. Please try opening in a new tab or downloading the file.
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInNewTab}
                      className="mr-2"
                    >
                      Open in New Tab
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <iframe
                src={url}
                className="w-full h-full border rounded"
                title={name}
                onError={handleIframeError}
                onLoad={() => {
                  // Check if iframe loaded successfully
                  setTimeout(() => {
                    try {
                      const iframe = document.querySelector('iframe[title="' + name + '"]') as HTMLIFrameElement;
                      if (iframe && iframe.contentDocument) {
                        const doc = iframe.contentDocument;
                        if (doc.body && doc.body.innerHTML.includes('This site can\'t be reached')) {
                          handleIframeError();
                        }
                      }
                    } catch (e) {
                      // Cross-origin issues are expected, ignore
                    }
                  }, 2000);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFViewer;







