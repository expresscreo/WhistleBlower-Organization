import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Eye, File as FileIcon, Download } from 'lucide-react';
import { sanitizeFilename } from '@/lib/utils';
import { getLocalFileUrl } from '@/lib/fileUtils';

const AttachmentPreview = ({ path }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const rawFileName = path.split('/').pop();
  const fileName = rawFileName ? sanitizeFilename(rawFileName.substring(rawFileName.indexOf('-') + 1)) : 'attachment';

  const isImage = fileName?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
  const isVideo = fileName?.match(/\.(mp4|webm|ogg)$/i) != null;
  const isAudio = fileName?.match(/\.(mp3|wav|ogg)$/i) != null;

  const generateUrl = async () => {
    setLoading(true);
    try {
      const localUrl = await getLocalFileUrl(path);
      setUrl(localUrl);
      return localUrl;
    } catch (e) {
      console.error("Error generating file URL:", e);
      toast({ title: 'Error', description: 'Could not load preview.', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async () => {
    let downloadUrl = url;
    if (!downloadUrl) {
        downloadUrl = await generateUrl();
    }

    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({ title: 'Download failed', description: 'Could not create a secure download link.', variant: 'destructive' });
    }
  };

  const renderPreviewContent = () => {
    if (loading) return <div className="w-full h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    if (!url) return <div className="w-full h-64 flex items-center justify-center text-muted-foreground">Click "View" to load content.</div>;

    if (isImage) return <img src={url} alt={`Preview of ${fileName}`} className="max-w-full max-h-[80vh] object-contain" />;
    if (isVideo) return <video src={url} controls className="max-w-full max-h-[80vh]" />;
    if (isAudio) return <audio src={url} controls className="w-full"/>;
    
    return (
        <div className="text-center p-8">
            <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
            <p>Preview is not available for this file type.</p>
            <p className="text-sm text-muted-foreground mb-4">{fileName}</p>
            <Button onClick={onDownload}><Download className="mr-2 h-4 w-4"/>Download File</Button>
        </div>
    );
  };
  
  return (
    <div className="border bg-card overflow-hidden group p-3">
        <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
            <p className="text-sm truncate flex-grow">{fileName}</p>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => !url && generateUrl()}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{fileName}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 flex items-center justify-center bg-muted/50">
                        {renderPreviewContent()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>
  );
};

export default AttachmentPreview;