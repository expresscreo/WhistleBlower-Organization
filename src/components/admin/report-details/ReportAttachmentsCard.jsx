import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Loader2, File as FileIcon, Mic, Eye } from 'lucide-react';
import { sanitizeFilename } from '@/lib/utils';
import { getLocalFileUrl } from '@/lib/fileUtils';
import { findVoiceNotePaths } from '@/lib/voiceNoteUtils';

const AttachmentPreview = ({ path, isVoiceNotePrimary }) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const rawFileName = path.split('/').pop();
  const fileName = rawFileName ? sanitizeFilename(rawFileName.substring(rawFileName.indexOf('-') + 1)) : 'attachment';
  const isImage = fileName?.match(/\.(avif|jpeg|jpg|gif|png|webp)$/i) != null;
  const isVideo = fileName?.match(/\.(mp4|webm|ogg)$/i) != null;
  const isAudio = fileName?.match(/\.(mp3|wav|ogg|m4a)$/i) != null;

  const generateUrl = async () => {
    setLoading(true);
    try {
      // If the path is a local WBMedia path or http(s) URL, don't use Supabase
      if (typeof path === 'string' && (path.startsWith('/WBMedia/') || path.startsWith('WBMedia/') || path.startsWith('http'))) {
        const localUrl = getLocalFileUrl(path);
        setUrl(localUrl);
        return localUrl;
      }

      // Otherwise assume it's a Supabase storage path and create a signed URL
      const { data, error: funcError } = await supabase.functions.invoke('create-signed-url', { body: { path } });
      if (funcError) throw funcError;
      if (data.error) throw new Error(data.error);
      setUrl(data.signedUrl);
      return data.signedUrl;
    } catch (e) {
      console.error('Could not load preview:', e);
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
    }
  };
  
  const renderPreviewContent = () => {
    if (loading) return <div className="w-full h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    if (!url) return <div className="w-full h-64 flex items-center justify-center text-muted-foreground">Click "View" to load content.</div>;
    if (isImage) return <img src={url} alt={`Preview of ${fileName}`} className="max-w-full max-h-[80vh] object-contain" />;
    if (isVideo) return <video src={url} controls className="max-w-full max-h-[80vh]" />;
    if (isAudio) return <div className="p-4 flex flex-col items-center justify-center"><Mic className="h-10 w-10 text-primary mb-4"/><audio src={url} controls className="w-full"/></div>;
    
    return (
        <div className="text-center p-8">
            <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
            <p>Preview is not available for this file type.</p>
            <p className="text-sm text-muted-foreground mb-4">{fileName}</p>
            <Button onClick={onDownload} className="uppercase"><Download className="mr-2 h-4 w-4"/>Download File</Button>
        </div>
    );
  };

  return (
    <div className="border bg-card overflow-hidden group p-3 space-y-2">
        <div className="flex items-center gap-2">
            {isVoiceNotePrimary ? <Mic className="h-5 w-5 text-primary flex-shrink-0"/> : <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0"/>}
            <p className="text-sm truncate flex-grow">{fileName}</p>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => !url && generateUrl()} className="uppercase">
                        <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>{fileName}</DialogTitle></DialogHeader>
                    <div className="py-4 flex items-center justify-center bg-muted/50">{renderPreviewContent()}</div>
                </DialogContent>
            </Dialog>
            <Button size="sm" variant="ghost" onClick={onDownload}><Download className="h-4 w-4" /></Button>
        </div>
    </div>
  );
};


const ReportAttachmentsCard = ({ evidencePath, isVoiceNote, hideVoiceNote = false }) => {
    const paths = Array.isArray(evidencePath) ? evidencePath : (evidencePath ? [evidencePath] : []);
    
    const voiceNotePaths = isVoiceNote ? findVoiceNotePaths(paths) : [];
    const otherPaths = paths.filter((p) => !voiceNotePaths.includes(p));

    return (
        <Card>
            <CardHeader><CardTitle className="text-2xl">Attachments</CardTitle></CardHeader>
            <CardContent>
                {paths.length > 0 ? (
                    <div className="space-y-2">
                        {!hideVoiceNote &&
                            voiceNotePaths.map((path) => (
                                <AttachmentPreview key={path} path={path} isVoiceNotePrimary={true} />
                            ))}
                        {otherPaths.map((path, index) => (
                            <AttachmentPreview key={index} path={path} isVoiceNotePrimary={false} />
                        ))}
                    </div>
                ) : <p className="text-sm text-muted-foreground">No evidence attached.</p>}
            </CardContent>
        </Card>
    );
};

export default ReportAttachmentsCard;