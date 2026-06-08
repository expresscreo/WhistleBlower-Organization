import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getLocalFileUrl } from '@/lib/fileUtils';
import { isImagePath } from '@/lib/mediaUtils';
import MaximizableThumbnailOverlay, { maximizableThumbnailGroupClass } from '@/components/media/MaximizableThumbnailOverlay';

const AttachmentItem = ({ file, onDownload }) => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const isImage = isImagePath(file.path) || isImagePath(file.name);

  useEffect(() => {
    let isMounted = true;
    const generateUrl = async () => {
      if (!file.path) {
        setError('File path is missing.');
        return;
      }
      
      // Use local file URL instead of Supabase signed URL
      const localUrl = getLocalFileUrl(file.path);
      
      if (!isMounted) return;
      setUrl(localUrl);
    };

    if (isImage) {
      generateUrl();
    }
    
    return () => { isMounted = false; };
  }, [file, isImage]);

  return (
    <div className="border p-2 my-2">
      {isImage && url && (
        <div className={`${maximizableThumbnailGroupClass} mb-2 rounded-md`}>
          <img src={url} alt={`Preview of ${file.name}`} className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105" />
          <MaximizableThumbnailOverlay />
        </div>
      )}
      {isImage && !url && !error && (
         <div className="w-full h-24 bg-muted flex items-center justify-center text-sm">Loading preview...</div>
      )}
      {error && (
        <div className="w-full h-24 bg-muted flex items-center justify-center text-sm text-destructive">{error}</div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-sm truncate pr-2">{file.name || 'Unnamed file'}</span>
        <Button size="sm" variant="outline" onClick={() => onDownload(file)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default AttachmentItem;